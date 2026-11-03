import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker source locally via Vite asset bundling
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  textBlocks: Array<{
    text: string;
    fontSize: number;
    isHeading: boolean;
  }>;
  imageDataUrl: string;
}

export async function convertPdfToEmailHtml(arrayBuffer: ArrayBuffer, fileName = 'document.pdf'): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = Math.min(pdfDoc.numPages, 4); // Max 4 pages for email compactness

  const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  let contentHtml = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    // Render page to canvas to preserve exact graphic/visual render (logos, layouts, signatures)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    let pageImageDataUrl = '';
    if (ctx) {
      await (page.render({ canvas, canvasContext: ctx, viewport } as any)).promise;
      pageImageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    }

    // Extract text content with positions
    const textContent = await page.getTextContent();
    const textItems: Array<{ str: string; height: number }> = [];

    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim().length > 0) {
        textItems.push({
          str: item.str.trim(),
          height: item.height || 12,
        });
      }
    });

    // Group text items into paragraphs
    const paragraphs: string[] = [];
    let currentP = '';
    textItems.forEach((item) => {
      if (item.height > 16) {
        if (currentP) {
          paragraphs.push(currentP);
          currentP = '';
        }
        paragraphs.push(`### ${item.str}`);
      } else {
        currentP += (currentP ? ' ' : '') + item.str;
        if (item.str.endsWith('.') || item.str.endsWith('!') || item.str.endsWith('?')) {
          paragraphs.push(currentP);
          currentP = '';
        }
      }
    });
    if (currentP) paragraphs.push(currentP);

    // Build HTML for this page
    contentHtml += `
      <!-- Page ${pageNum} Header Graphic Preview (Logo/Artwork fidelité garantie) -->
      ${pageImageDataUrl ? `
      <tr>
        <td style="padding: 12px 24px; text-align: center;">
          <img src="${pageImageDataUrl}" alt="Aperçu Page ${pageNum}" width="550" style="width: 100%; max-width: 550px; height: auto; border-radius: 6px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />
        </td>
      </tr>
      ` : ''}

      <!-- Page ${pageNum} Extracted Text Elements -->
      <tr>
        <td style="padding: 16px 32px 24px 32px; font-family: Arial, sans-serif; color: #334155; line-height: 24px;">
          ${paragraphs.slice(0, 8).map(p => {
            if (p.startsWith('### ')) {
              return `<h2 style="font-size: 19px; line-height: 25px; color: #0f172a; margin-top: 16px; margin-bottom: 8px; font-weight: bold;">${p.replace('### ', '')}</h2>`;
            }
            return `<p style="font-size: 14px; line-height: 22px; color: #475569; margin-top: 0; margin-bottom: 12px;">${p}</p>`;
          }).join('')}
        </td>
      </tr>
    `;
  }

  // Complete email boilerplate
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif;">
  <center style="width: 100%; background-color: #f1f5f9; padding: 24px 0;">
    <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
      <tr><td>
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <tr>
        <td style="padding: 24px 32px; background-color: #1e293b; color: #ffffff;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px;">Document PDF Reconstruit</div>
          <div style="font-size: 20px; font-weight: bold; color: #ffffff;">${title}</div>
        </td>
      </tr>
      ${contentHtml}
      <tr>
        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Extrait fidèlement depuis ${fileName} par Courrier Studio</p>
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
