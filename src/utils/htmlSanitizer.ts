import { SelectedElementInfo } from '../types/editor';

let idCounter = 1;

export function generateElementId(prefix = 'el'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Strips dangerous scripts and event handlers while preserving all email markup,
 * tables, styles, conditional comments and tags.
 */
export function sanitizeAndTagHtml(rawHtml: string): { sanitizedHtml: string; elementCount: number } {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return { sanitizedHtml: '', elementCount: 0 };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove dangerous executable elements
  const dangerousElements = doc.querySelectorAll('script, embed, object, applet');
  dangerousElements.forEach((el) => el.remove());

  // Remove inline JS event handlers (onclick, onload, etc.)
  const allElements = doc.querySelectorAll('*');
  let elementCount = 0;

  allElements.forEach((el) => {
    // Strip on* event attributes
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      if (attr.name.toLowerCase() === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.setAttribute('href', '#');
      }
    }

    // Only tag body descendants with editable data-cs-id
    if (doc.body && doc.body.contains(el) && el !== doc.body) {
      if (!el.getAttribute('data-cs-id')) {
        el.setAttribute('data-cs-id', `cs-${idCounter++}`);
      }
      elementCount++;
    }
  });

  return {
    sanitizedHtml: doc.documentElement.outerHTML,
    elementCount,
  };
}

/**
 * Categorizes an HTML element into a user-friendly email element type
 */
export function categorizeElement(element: HTMLElement): SelectedElementInfo['type'] {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'img') return 'image';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return 'heading';
  if (['p', 'span', 'strong', 'em', 'b', 'i', 'small', 'li'].includes(tagName)) return 'text';
  if (tagName === 'a') {
    // Check if styled like a button
    const style = window.getComputedStyle(element);
    const hasButtonBg = style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
    const hasPadding = parseInt(style.paddingLeft, 10) > 4;
    return (hasButtonBg && hasPadding) || element.classList.contains('button') || element.classList.contains('btn') ? 'button' : 'text';
  }
  if (tagName === 'table') return 'table';
  if (tagName === 'tr') return 'row';
  if (tagName === 'td' || tagName === 'th') return 'cell';
  if (tagName === 'hr') return 'divider';
  if (tagName === 'div' && (element.offsetHeight < 30 || element.style.height || element.style.lineHeight)) {
    if (element.textContent?.trim() === '') return 'spacer';
  }
  if (['div', 'section', 'article', 'main', 'header', 'footer'].includes(tagName)) return 'container';

  return 'unknown';
}

/**
 * Extracts element info for the right properties panel and canvas gizmo
 */
export function extractElementInfo(element: HTMLElement): SelectedElementInfo {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  const type = categorizeElement(element);

  return {
    id: element.getAttribute('data-cs-id') || '',
    tagName: element.tagName.toLowerCase(),
    type,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    styles: {
      color: element.style.color || computed.color || '',
      backgroundColor: element.style.backgroundColor || computed.backgroundColor || '',
      fontSize: element.style.fontSize || computed.fontSize || '',
      fontWeight: element.style.fontWeight || computed.fontWeight || '',
      fontFamily: element.style.fontFamily || computed.fontFamily || '',
      textAlign: element.style.textAlign || computed.textAlign || '',
      lineHeight: element.style.lineHeight || computed.lineHeight || '',
      letterSpacing: element.style.letterSpacing || computed.letterSpacing || '',
      paddingTop: element.style.paddingTop || computed.paddingTop || '',
      paddingRight: element.style.paddingRight || computed.paddingRight || '',
      paddingBottom: element.style.paddingBottom || computed.paddingBottom || '',
      paddingLeft: element.style.paddingLeft || computed.paddingLeft || '',
      marginTop: element.style.marginTop || computed.marginTop || '',
      marginRight: element.style.marginRight || computed.marginRight || '',
      marginBottom: element.style.marginBottom || computed.marginBottom || '',
      marginLeft: element.style.marginLeft || computed.marginLeft || '',
      width: element.style.width || (element.getAttribute('width') ? `${element.getAttribute('width')}px` : `${Math.round(rect.width)}px`),
      height: element.style.height || (element.getAttribute('height') ? `${element.getAttribute('height')}px` : `${Math.round(rect.height)}px`),
      borderRadius: element.style.borderRadius || computed.borderRadius || '',
      borderWidth: element.style.borderWidth || computed.borderWidth || '',
      borderColor: element.style.borderColor || computed.borderColor || '',
      borderStyle: element.style.borderStyle || computed.borderStyle || '',
      display: element.style.display || computed.display || '',
      position: element.style.position || computed.position || '',
      transform: element.style.transform || computed.transform || '',
    },
    attributes: {
      href: element.getAttribute('href') || undefined,
      src: element.getAttribute('src') || undefined,
      alt: element.getAttribute('alt') || undefined,
      title: element.getAttribute('title') || undefined,
      width: element.getAttribute('width') || undefined,
      height: element.getAttribute('height') || undefined,
      align: element.getAttribute('align') || undefined,
      bgColor: element.getAttribute('bgcolor') || undefined,
    },
    text: element.textContent || '',
    isLocked: element.getAttribute('data-cs-locked') === 'true',
  };
}

/**
 * Formats HTML with clean indentation for the Code Editor
 */
export function formatHtml(html: string): string {
  try {
    let formatted = '';
    let indentLevel = 0;
    const tab = '  ';

    // Normalize spacing
    const clean = html
      .replace(/>\s*</g, '><')
      .replace(/</g, '\n<')
      .trim();

    const lines = clean.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if closing tag
      if (line.match(/^<\/\w/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted += tab.repeat(indentLevel) + line + '\n';

      // Check if opening tag and not self-closing or void tag
      const isOpening = line.match(/^<[^\/!][^>]*>$/);
      const isSelfClosing = line.match(/\/>$/) || line.match(/^<(img|input|br|hr|meta|link|col)[^>]*>$/i);

      if (isOpening && !isSelfClosing) {
        indentLevel++;
      }
    }

    return formatted.trim();
  } catch {
    return html;
  }
}

/**
 * Prepares the final exportable HTML:
 * Strips editor internal attributes (`data-cs-id`, `data-cs-locked`, etc.)
 * while keeping all formatting, email styles, tables and conditional comments.
 */
export function cleanHtmlForExport(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const taggedElements = doc.querySelectorAll('[data-cs-id], [data-cs-locked]');
  taggedElements.forEach((el) => {
    el.removeAttribute('data-cs-id');
    el.removeAttribute('data-cs-locked');
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
