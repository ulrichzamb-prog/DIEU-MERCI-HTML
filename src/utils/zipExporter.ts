import JSZip from 'jszip';
import { EmailMetadata } from '../types/editor';
import { cleanHtmlForExport } from './htmlSanitizer';

/**
 * Creates a complete ZIP package with the HTML template,
 * extracted image assets into an images/ folder, and email metadata.
 */
export async function createEmailZipPackage(
  rawHtml: string,
  metadata: EmailMetadata,
  documentTitle = 'email-template'
): Promise<Blob> {
  const zip = new JSZip();
  let cleanHtml = cleanHtmlForExport(rawHtml);

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');
  const images = Array.from(doc.querySelectorAll('img'));
  const imagesFolder = zip.folder('images');

  let imageIndex = 1;
  for (const img of images) {
    const src = img.getAttribute('src');
    if (src && src.startsWith('data:image/')) {
      const match = src.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        let ext = match[1];
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'svg+xml') ext = 'svg';

        const base64Data = match[2];
        const imageName = `image-${imageIndex++}.${ext}`;

        // Add image to images/ in ZIP
        imagesFolder?.file(imageName, base64Data, { base64: true });

        // Update HTML reference to relative path
        img.setAttribute('src', `images/${imageName}`);
      }
    }
  }

  // Update HTML with relative image paths
  cleanHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

  // Add files to ZIP
  zip.file('index.html', cleanHtml);
  zip.file(
    'metadata.json',
    JSON.stringify(
      {
        title: documentTitle,
        exportedAt: new Date().toISOString(),
        metadata,
      },
      null,
      2
    )
  );

  return await zip.generateAsync({ type: 'blob' });
}
