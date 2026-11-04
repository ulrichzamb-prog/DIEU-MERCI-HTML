import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { exportHtmlToDocx } from './docxExporter';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { convertPdfToEmailHtml } from './pdfImporter';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Wraps body content in a production-ready, email-client-compatible layout
 * with responsive table structure, header card, typography, and Outlook MSO support.
 */
export function wrapInEmailBoilerplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    body, table, td, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #1e293b; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <center style="width: 100%; background-color: #f1f5f9; padding: 24px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
      <tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
      <tr>
        <td style="padding: 24px 32px; background-color: #1e293b; color: #ffffff;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px;">Courrier Studio Document Converti</div>
          <div style="font-size: 20px; font-weight: bold; color: #ffffff;">${title}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 32px; font-size: 14px; line-height: 24px; color: #334155;">
          ${bodyContent}
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Généré avec mise en page & images préservées par Courrier Studio &bull; <a href="#" style="color: #6366f1; text-decoration: underline;">Se désabonner</a></p>
        </td>
      </tr>
    </table>
    <!--[if (gte mso 9)|(IE)]>
      </td></tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}

export type FileCategory = 'documents' | 'images' | 'spreadsheets' | 'presentations' | 'archives';

export interface SupportedFormat {
  ext: string;
  name: string;
  category: FileCategory;
  mime: string;
  targetFormats: string[];
}

export const FORMAT_REGISTRY: Record<string, SupportedFormat> = {
  // Documents
  pdf: { ext: 'pdf', name: 'Portable Document Format', category: 'documents', mime: 'application/pdf', targetFormats: ['docx', 'txt', 'html'] },
  docx: { ext: 'docx', name: 'Microsoft Word', category: 'documents', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', targetFormats: ['html', 'txt', 'pdf'] },
  doc: { ext: 'doc', name: 'Microsoft Word (Legacy)', category: 'documents', mime: 'application/msword', targetFormats: ['html', 'txt'] },
  txt: { ext: 'txt', name: 'Texte Brut', category: 'documents', mime: 'text/plain', targetFormats: ['docx', 'html', 'pdf', 'md'] },
  html: { ext: 'html', name: 'HyperText Markup Language', category: 'documents', mime: 'text/html', targetFormats: ['docx', 'txt', 'pdf'] },
  md: { ext: 'md', name: 'Markdown', category: 'documents', mime: 'text/markdown', targetFormats: ['html', 'docx', 'txt'] },
  rtf: { ext: 'rtf', name: 'Rich Text Format', category: 'documents', mime: 'application/rtf', targetFormats: ['txt', 'html'] },
  odt: { ext: 'odt', name: 'OpenDocument Text', category: 'documents', mime: 'application/vnd.oasis.opendocument.text', targetFormats: ['txt', 'html'] },
  epub: { ext: 'epub', name: 'Electronic Publication', category: 'documents', mime: 'application/epub+zip', targetFormats: ['txt', 'html'] },

  // Images
  jpg: { ext: 'jpg', name: 'JPEG Image', category: 'images', mime: 'image/jpeg', targetFormats: ['png', 'webp', 'bmp', 'ico', 'pdf', 'html'] },
  jpeg: { ext: 'jpeg', name: 'JPEG Image', category: 'images', mime: 'image/jpeg', targetFormats: ['png', 'webp', 'bmp', 'ico', 'pdf', 'html'] },
  png: { ext: 'png', name: 'PNG Image', category: 'images', mime: 'image/png', targetFormats: ['jpg', 'webp', 'bmp', 'ico', 'pdf', 'html'] },
  webp: { ext: 'webp', name: 'WebP Image', category: 'images', mime: 'image/webp', targetFormats: ['png', 'jpg', 'bmp', 'ico', 'html'] },
  bmp: { ext: 'bmp', name: 'Bitmap Image', category: 'images', mime: 'image/bmp', targetFormats: ['png', 'jpg', 'webp', 'html'] },
  ico: { ext: 'ico', name: 'Icon Format', category: 'images', mime: 'image/x-icon', targetFormats: ['png', 'jpg', 'html'] },
  svg: { ext: 'svg', name: 'Scalable Vector Graphics', category: 'images', mime: 'image/svg+xml', targetFormats: ['png', 'jpg', 'webp', 'html'] },
  gif: { ext: 'gif', name: 'GIF Animation / Image', category: 'images', mime: 'image/gif', targetFormats: ['png', 'jpg', 'webp', 'html'] },
  tiff: { ext: 'tiff', name: 'Tagged Image File Format', category: 'images', mime: 'image/tiff', targetFormats: ['png', 'jpg', 'html'] },
  avif: { ext: 'avif', name: 'AVIF Image', category: 'images', mime: 'image/avif', targetFormats: ['png', 'jpg', 'html'] },

  // Spreadsheets
  xlsx: { ext: 'xlsx', name: 'Microsoft Excel', category: 'spreadsheets', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', targetFormats: ['csv', 'txt', 'html', 'ods'] },
  xls: { ext: 'xls', name: 'Microsoft Excel (Legacy)', category: 'spreadsheets', mime: 'application/vnd.ms-excel', targetFormats: ['csv', 'xlsx', 'txt', 'html'] },
  csv: { ext: 'csv', name: 'Comma Separated Values', category: 'spreadsheets', mime: 'text/csv', targetFormats: ['xlsx', 'html', 'txt', 'ods'] },
  ods: { ext: 'ods', name: 'OpenDocument Spreadsheet', category: 'spreadsheets', mime: 'application/vnd.oasis.opendocument.spreadsheet', targetFormats: ['csv', 'xlsx', 'html'] },

  // Presentations
  pptx: { ext: 'pptx', name: 'Microsoft PowerPoint', category: 'presentations', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', targetFormats: ['pdf', 'txt', 'html'] },
  ppt: { ext: 'ppt', name: 'Microsoft PowerPoint (Legacy)', category: 'presentations', mime: 'application/vnd.ms-powerpoint', targetFormats: ['txt'] },
  odp: { ext: 'odp', name: 'OpenDocument Presentation', category: 'presentations', mime: 'application/vnd.oasis.opendocument.presentation', targetFormats: ['pdf', 'txt'] },

  // Archives
  zip: { ext: 'zip', name: 'ZIP Archive', category: 'archives', mime: 'application/zip', targetFormats: ['extract'] },
  tar: { ext: 'tar', name: 'TAR Archive', category: 'archives', mime: 'application/x-tar', targetFormats: ['zip'] },
  gz: { ext: 'gz', name: 'GZip Archive', category: 'archives', mime: 'application/gzip', targetFormats: ['extract'] },
  '7z': { ext: '7z', name: '7-Zip Archive', category: 'archives', mime: 'application/x-7z-compressed', targetFormats: ['extract'] },
};

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getAvailableTargetFormats(filename: string): string[] {
  const ext = getFileExtension(filename);
  return FORMAT_REGISTRY[ext]?.targetFormats || ['txt', 'html'];
}

/**
 * Image Format Conversion using Browser Canvas
 */
async function convertImageFile(file: File, targetExt: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 400;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context non disponible'));
            return;
          }

          // Fill white background for formats without alpha like JPEG / PDF
          if (['jpg', 'jpeg', 'bmp', 'pdf'].includes(targetExt)) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          if (targetExt === 'pdf') {
            const { jsPDF } = await import('jspdf');
            const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
              orientation,
              unit: 'px',
              format: [canvas.width, canvas.height],
            });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
            return resolve(pdf.output('blob'));
          }

          if (targetExt === 'html') {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            const imageHtml = `
              <div style="text-align: center; margin: 0 auto 20px auto;">
                <img src="${dataUrl}" alt="${baseName}" width="${Math.min(560, canvas.width)}" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px; display: block; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
              </div>
              <h2 style="font-size: 22px; line-height: 28px; color: #0f172a; margin: 20px 0 10px 0; font-weight: bold;">${baseName}</h2>
              <p style="font-size: 14px; line-height: 24px; color: #475569; margin: 0 0 24px 0;">Ce visuel a été converti fidèlement en template email HTML éditable. Vous pouvez modifier les textes, déplacer les éléments ou remplacer les images dans l'éditeur visuel.</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #4f46e5;">
                    <a href="https://example.com" style="background-color: #4f46e5; border: 1px solid #4f46e5; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; color: #ffffff; border-radius: 6px; display: inline-block;">En savoir plus &rarr;</a>
                  </td>
                </tr>
              </table>
            `;
            const fullHtml = wrapInEmailBoilerplate(baseName, imageHtml);
            return resolve(new Blob([fullHtml], { type: 'text/html;charset=utf-8;' }));
          }

          let mimeType = 'image/png';
          if (['jpg', 'jpeg'].includes(targetExt)) mimeType = 'image/jpeg';
          if (targetExt === 'webp') mimeType = 'image/webp';
          if (targetExt === 'ico') mimeType = 'image/x-icon';

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Échec d\'encodage de l\'image'));
          }, mimeType, 0.95);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

/**
 * Spreadsheet Conversion using SheetJS (XLSX, CSV, ODS, XLS)
 */
async function convertSpreadsheetFile(file: File, targetExt: string): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0] || 'Feuille1';
  const worksheet = workbook.Sheets[firstSheetName];

  if (targetExt === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  if (targetExt === 'html') {
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    let tableHtml = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 6px 0; font-weight: bold;">${baseName}</h2>
        <div style="font-size: 12px; color: #64748b;">Feuille : ${firstSheetName} &bull; ${rows.length} lignes extraites</div>
      </div>
      <div style="overflow-x: auto;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; font-family: Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
    `;

    rows.slice(0, 50).forEach((row, rowIdx) => {
      const isHeader = rowIdx === 0;
      const bgStyle = isHeader
        ? 'background-color: #1e293b; color: #ffffff; font-weight: bold;'
        : rowIdx % 2 === 0
        ? 'background-color: #f8fafc;'
        : 'background-color: #ffffff;';
      tableHtml += `<tr style="${bgStyle}">`;
      row.forEach((cell) => {
        const tag = isHeader ? 'th' : 'td';
        const color = isHeader ? '#ffffff' : '#334155';
        tableHtml += `<${tag} style="border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; color: ${color};">${cell !== undefined && cell !== null ? String(cell) : '&nbsp;'}</${tag}>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</table></div>';
    const fullHtml = wrapInEmailBoilerplate(baseName, tableHtml);
    return new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  }

  if (targetExt === 'txt') {
    const txtContent = XLSX.utils.sheet_to_txt(worksheet);
    return new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  }

  if (targetExt === 'xlsx') {
    const outBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  if (targetExt === 'ods') {
    const outBuffer = XLSX.write(workbook, { bookType: 'ods', type: 'array' });
    return new Blob([outBuffer], { type: 'application/vnd.oasis.opendocument.spreadsheet' });
  }

  throw new Error(`Format tableur cible .${targetExt} non supporté`);
}

/**
 * Document Conversions (PDF, DOCX, TXT, HTML, MD)
 */
async function convertDocumentFile(
  file: File,
  targetExt: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const sourceExt = getFileExtension(file.name);
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // 1. PDF -> HTML / DOCX / TXT
  if (sourceExt === 'pdf') {
    onProgress?.(30);
    const arrayBuffer = await file.arrayBuffer();

    // Preserve full layout, extracted images and page render when converting to HTML!
    if (targetExt === 'html') {
      onProgress?.(60);
      const emailHtml = await convertPdfToEmailHtml(arrayBuffer, file.name);
      return new Blob([emailHtml], { type: 'text/html;charset=utf-8;' });
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n--- Page ${i} ---\n\n` + pageText + '\n';
      onProgress?.(30 + Math.round((i / pdf.numPages) * 50));
    }

    if (targetExt === 'txt') {
      return new Blob([fullText], { type: 'text/plain;charset=utf-8;' });
    }
    if (targetExt === 'docx') {
      const html = fullText.split('\n\n').map(p => `<p>${p}</p>`).join('');
      return await exportHtmlToDocx(html, file.name);
    }
  }

  // 2. DOCX -> HTML / TXT
  if (sourceExt === 'docx') {
    onProgress?.(40);
    const arrayBuffer = await file.arrayBuffer();

    // Preserve inline images, headings, and formatting when converting DOCX to HTML!
    if (targetExt === 'html') {
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement((image: any) => {
            return image.read('base64').then((imageBuffer: string) => {
              return {
                src: `data:${image.contentType};base64,${imageBuffer}`,
                style: 'width: 100%; max-width: 540px; height: auto; border-radius: 6px; display: block; margin: 16px auto; border: 1px solid #e2e8f0;',
              };
            });
          }),
        }
      );
      const docxBody = result.value || '<p>Document Word converti</p>';
      const fullHtml = wrapInEmailBoilerplate(baseName, docxBody);
      return new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    }

    if (targetExt === 'txt') {
      const text = await mammoth.extractRawText({ arrayBuffer });
      return new Blob([text.value], { type: 'text/plain;charset=utf-8;' });
    }
  }

  // 3. TXT / HTML / MD -> DOCX / HTML / TXT
  if (['txt', 'html', 'md'].includes(sourceExt)) {
    onProgress?.(50);
    const text = await file.text();
    if (targetExt === 'docx') {
      const html = sourceExt === 'html' ? text : text.split('\n\n').map(p => `<p>${p}</p>`).join('');
      return await exportHtmlToDocx(html, file.name);
    }
    if (targetExt === 'html') {
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
      const bodyContent = paragraphs.map(p => {
        if (p.startsWith('# ')) return `<h1 style="font-size: 24px; color: #0f172a; margin: 16px 0 8px 0; font-weight: bold;">${p.replace('# ', '')}</h1>`;
        if (p.startsWith('## ')) return `<h2 style="font-size: 19px; color: #1e293b; margin: 14px 0 6px 0; font-weight: bold;">${p.replace('## ', '')}</h2>`;
        return `<p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 12px 0;">${p}</p>`;
      }).join('');
      const fullHtml = wrapInEmailBoilerplate(baseName, bodyContent);
      return new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    }
    if (targetExt === 'txt') {
      return new Blob([text], { type: 'text/plain;charset=utf-8;' });
    }
  }

  throw new Error(`Conversion de ${sourceExt} vers ${targetExt} non prise en charge dans ce contexte.`);
}

/**
 * Archive extraction or packaging
 */
async function convertArchiveFile(file: File): Promise<Blob> {
  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();
  const loadedZip = await zip.loadAsync(arrayBuffer);

  // Return a fresh clean ZIP containing extracted entries
  return await loadedZip.generateAsync({ type: 'blob' });
}

/**
 * Unified conversion runner for PeaceLoveConvert
 */
export async function executeFileConversion(
  file: File,
  targetExt: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const sourceExt = getFileExtension(file.name);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const outFilename = `${baseName}.${targetExt}`;

  onProgress?.(15);

  const sourceMeta = FORMAT_REGISTRY[sourceExt];
  const category = sourceMeta?.category || 'documents';

  let resultBlob: Blob;

  if (category === 'images') {
    resultBlob = await convertImageFile(file, targetExt);
  } else if (category === 'spreadsheets') {
    resultBlob = await convertSpreadsheetFile(file, targetExt);
  } else if (category === 'archives') {
    resultBlob = await convertArchiveFile(file);
  } else {
    resultBlob = await convertDocumentFile(file, targetExt, onProgress);
  }

  onProgress?.(100);
  return { blob: resultBlob, filename: outFilename };
}

/**
 * Normalizes any image (File, Blob, or URL) to a high-contrast standard PNG data URL.
 * Fills white background behind transparent areas to avoid black artifacts in OCR.
 */
async function normalizeImageForOcr(fileOrBlobOrUrl: File | Blob | string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let objectUrl = '';
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origWidth = img.naturalWidth || img.width || 800;
        const origHeight = img.naturalHeight || img.height || 600;

        let scale = 1.0;
        if (origWidth < 800 && origHeight < 800) {
          scale = 1.5;
        } else if (origWidth > 3200 || origHeight > 3200) {
          scale = 3200 / Math.max(origWidth, origHeight);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(origWidth * scale);
        canvas.height = Math.round(origHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context non disponible'));
          return;
        }

        // Fill white background to eliminate transparency issues
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      } catch (err) {
        reject(err);
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de décoder l'image source pour l'OCR"));
    };

    if (typeof fileOrBlobOrUrl === 'string') {
      img.src = fileOrBlobOrUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrBlobOrUrl);
      img.src = objectUrl;
    }
  });
}

/**
 * Extracts digital text and renders high-res page images from a PDF file.
 */
async function extractTextAndPagesFromPdf(
  file: File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<{ digitalText: string; pageImages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, 10);

  let digitalText = '';
  const pageImages: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(10 + Math.round((i / numPages) * 20), `Extraction de la page PDF ${i}/${numPages}...`);
    const page = await pdf.getPage(i);

    // 1. Extract digital text if present
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ').trim();
    if (pageText.length > 25) {
      digitalText += (digitalText ? '\n\n' : '') + `--- Page ${i} ---\n` + pageText;
    }

    // 2. Render high-resolution page canvas for OCR
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await (page.render({ canvas, canvasContext: ctx, viewport } as any)).promise;
      pageImages.push(canvas.toDataURL('image/png'));
    }
  }

  return { digitalText, pageImages };
}

/**
 * Tesseract OCR Runner
 * Supports French, English, Spanish, Portuguese, German
 * Supports both images (JPG, PNG, WebP, etc.) and PDFs
 */
export async function runOcrRecognition(
  fileOrImage: File | Blob | string,
  language: 'fra' | 'eng' | 'spa' | 'por' | 'deu' = 'fra',
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  const isPdf =
    (fileOrImage instanceof File && (fileOrImage.type === 'application/pdf' || fileOrImage.name.toLowerCase().endsWith('.pdf'))) ||
    (fileOrImage instanceof Blob && fileOrImage.type === 'application/pdf');

  // 1. PDF Handling
  if (isPdf) {
    onProgress?.(10, 'Analyse du document PDF...');
    const { digitalText, pageImages } = await extractTextAndPagesFromPdf(
      fileOrImage as File | Blob,
      onProgress
    );

    // If PDF already has clean digital text and no scanned images needed
    if (digitalText && digitalText.length > 200 && pageImages.length === 0) {
      onProgress?.(100, 'Texte numérique extrait avec succès !');
      return digitalText;
    }

    // Otherwise, OCR the rendered page images
    if (pageImages.length > 0) {
      onProgress?.(35, `Initialisation du moteur OCR Tesseract (${language.toUpperCase()})...`);
      const worker = await createWorker(language, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pagePct = Math.round(m.progress * 100);
            onProgress?.(35 + Math.round(m.progress * 55), `OCR en cours: ${pagePct}%`);
          }
        },
      });

      try {
        const ocrResults: string[] = [];
        for (let idx = 0; idx < pageImages.length; idx++) {
          const pageImg = pageImages[idx];
          onProgress?.(
            35 + Math.round((idx / pageImages.length) * 55),
            `Reconnaissance OCR - Page ${idx + 1}/${pageImages.length}...`
          );
          const ret = await worker.recognize(pageImg);
          const pageText = ret.data.text.trim();
          if (pageText) {
            ocrResults.push(`--- Page ${idx + 1} ---\n` + pageText);
          }
        }

        const combinedOcr = ocrResults.join('\n\n');
        const finalOutput = combinedOcr.trim().length > 0 ? combinedOcr : digitalText;
        onProgress?.(100, 'Reconnaissance terminée avec succès !');
        return finalOutput || '(Aucun texte détecté dans le document)';
      } finally {
        await worker.terminate();
      }
    }

    return digitalText || '(Aucun texte détecté dans le document PDF)';
  }

  // 2. Image Handling (File, Blob, Data URL)
  onProgress?.(10, "Préparation et normalisation de l'image...");
  const normalizedPng = await normalizeImageForOcr(fileOrImage);

  onProgress?.(25, `Initialisation du moteur OCR Tesseract (${language.toUpperCase()})...`);
  const worker = await createWorker(language, undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const pct = Math.round(m.progress * 100);
        onProgress?.(25 + Math.round(m.progress * 70), `Reconnaissance des caractères: ${pct}%`);
      }
    },
  });

  try {
    onProgress?.(35, `Analyse optique du texte (${language.toUpperCase()})...`);
    const ret = await worker.recognize(normalizedPng);
    onProgress?.(100, 'Reconnaissance terminée avec succès !');
    return ret.data.text || '(Aucun texte lisible détecté sur cette image)';
  } finally {
    await worker.terminate();
  }
}

/**
 * Converts extracted OCR text into a beautiful, typographically rich email template
 * with headings, stylized sections, callout boxes, and responsive 600px email table.
 */
export function formatOcrToEmailHtml(title: string, rawOcrText: string, previewImageDataUrl?: string): string {
  const lines = rawOcrText.split('\n').map((l) => l.trim()).filter(Boolean);
  let bodyContent = '';

  if (previewImageDataUrl) {
    bodyContent += `
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${previewImageDataUrl}" alt="Visuel Original Reconstruit" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />
      </div>
    `;
  }

  let inList = false;
  lines.forEach((line) => {
    const isHeader = line.length < 60 && (line === line.toUpperCase() || line.startsWith('---') || line.endsWith(':'));
    const isBullet = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ');

    if (line.startsWith('---')) {
      if (inList) { bodyContent += '</ul>'; inList = false; }
      bodyContent += `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`;
    } else if (isHeader) {
      if (inList) { bodyContent += '</ul>'; inList = false; }
      bodyContent += `<h2 style="font-size: 18px; line-height: 26px; color: #0f172a; font-weight: bold; margin: 20px 0 8px 0; font-family: Arial, sans-serif;">${line.replace(/:$/, '')}</h2>`;
    } else if (isBullet) {
      if (!inList) {
        bodyContent += `<ul style="margin: 12px 0 16px 20px; padding: 0; color: #334155; font-size: 14px; line-height: 22px;">`;
        inList = true;
      }
      bodyContent += `<li style="margin-bottom: 6px;">${line.replace(/^[-*•]\s*/, '')}</li>`;
    } else {
      if (inList) { bodyContent += '</ul>'; inList = false; }
      bodyContent += `<p style="font-size: 14px; line-height: 24px; color: #334155; margin: 0 0 14px 0; font-family: Arial, sans-serif;">${line}</p>`;
    }
  });

  if (inList) bodyContent += '</ul>';

  return wrapInEmailBoilerplate(title, bodyContent);
}

