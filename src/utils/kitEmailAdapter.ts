export interface KitAuditReport {
  isValid: boolean;
  score: number;
  hasMessageContent: boolean;
  hasUnsubscribe: boolean;
  hasAddress: boolean;
  structuralTablesOptimized: number;
  dataTablesPreserved: number;
  insecureHttpUrls: string[];
  issues: {
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    variable?: string;
  }[];
}

/**
 * Checks if a table is a data table (tabular data, headers, cells with prices, etc.)
 * vs a layout/wrapper structure table.
 */
function isDataTable(table: HTMLTableElement): boolean {
  if (table.getAttribute('role') === 'presentation') return false;
  // If it has explicit <th> headers or class indicating table data
  if (table.querySelector('th')) return true;
  if (table.classList.contains('data-table') || table.classList.contains('table-data')) return true;
  
  // If it has visible borders intentionally styled by user (e.g. 1px solid or border>0)
  const borderAttr = table.getAttribute('border');
  if (borderAttr && parseInt(borderAttr, 10) > 0) return true;

  return false;
}

/**
 * Analyzes HTML email for Kit (ConvertKit) compliance
 */
export function auditForKit(html: string): KitAuditReport {
  const issues: KitAuditReport['issues'] = [];
  const hasMessageContent = html.includes('{{ message_content }}') || html.includes('{{message_content}}');
  const hasUnsubscribe = html.includes('{{ unsubscribe_link }}') || html.includes('{{ unsubscribe_url }}') || html.includes('{{unsubscribe_link}}') || html.includes('{{unsubscribe_url}}');
  const hasAddress = html.includes('{{ address }}') || html.includes('{{address}}');

  if (!hasMessageContent) {
    issues.push({
      type: 'error',
      title: 'Variable {{ message_content }} absente',
      description: 'Obligatoire dans Kit pour que le contenu dynamique de vos emails ou newsletters soit injecté au bon endroit.',
      variable: '{{ message_content }}',
    });
  }

  if (!hasUnsubscribe) {
    issues.push({
      type: 'error',
      title: 'Lien de désabonnement {{ unsubscribe_url }} absent',
      description: 'Exigé par la loi (CAN-SPAM / RGPD) et par Kit pour permettre aux abonnés de se désinscrire en 1 clic.',
      variable: '{{ unsubscribe_url }}',
    });
  }

  if (!hasAddress) {
    issues.push({
      type: 'warning',
      title: 'Adresse physique {{ address }} recommandée',
      description: 'Kit recommande d\'inclure l\'adresse postale physique de l\'expéditeur dans le pied de page.',
      variable: '{{ address }}',
    });
  }

  // Check for non-https links or images
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const insecureHttpUrls: string[] = [];
  doc.querySelectorAll('img[src^="http://"]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) insecureHttpUrls.push(src);
  });
  doc.querySelectorAll('a[href^="http://"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href) insecureHttpUrls.push(href);
  });

  if (insecureHttpUrls.length > 0) {
    issues.push({
      type: 'warning',
      title: `${insecureHttpUrls.length} ressource(s) HTTP non sécurisée(s)`,
      description: 'Certains webmails bloquent les images HTTP mixtes. Privilégiez toujours HTTPS.',
    });
  }

  // Count structural vs data tables
  const tables = Array.from(doc.querySelectorAll('table'));
  let structuralCount = 0;
  let dataCount = 0;

  tables.forEach((t) => {
    if (isDataTable(t as HTMLTableElement)) {
      dataCount++;
    } else {
      structuralCount++;
    }
  });

  const criticalErrors = issues.filter((i) => i.type === 'error').length;
  const isValid = criticalErrors === 0;

  let score = 100;
  if (!hasMessageContent) score -= 35;
  if (!hasUnsubscribe) score -= 30;
  if (!hasAddress) score -= 15;
  if (insecureHttpUrls.length > 0) score -= 10;
  score = Math.max(10, score);

  return {
    isValid,
    score,
    hasMessageContent,
    hasUnsubscribe,
    hasAddress,
    structuralTablesOptimized: structuralCount,
    dataTablesPreserved: dataCount,
    insecureHttpUrls,
    issues,
  };
}

/**
 * Optimizes HTML specifically for Kit:
 * 1. Makes structural table borders, outlines and margins completely invisible.
 * 2. Preserves authentic visible data tables.
 * 3. Preserves all Kit tags and variables.
 */
export function adaptHtmlForKit(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const tables = Array.from(doc.querySelectorAll('table'));

  tables.forEach((t) => {
    const table = t as HTMLTableElement;

    if (!isDataTable(table)) {
      // Structural table: make all technical borders and spacings strictly zero
      table.setAttribute('role', 'presentation');
      table.setAttribute('border', '0');
      table.setAttribute('cellpadding', '0');
      table.setAttribute('cellspacing', '0');

      const existingStyle = table.getAttribute('style') || '';
      // Ensure border-collapse and border: 0 are present
      const cleanStyle = existingStyle
        .replace(/border:[^;]+;?/gi, '')
        .replace(/border-collapse:[^;]+;?/gi, '')
        .replace(/border-spacing:[^;]+;?/gi, '')
        .trim();

      table.setAttribute(
        'style',
        `${cleanStyle ? cleanStyle + '; ' : ''}border-collapse: collapse; border-spacing: 0; border: 0;`
      );

      // Clean cells of structural tables from unwanted technical borders
      table.querySelectorAll('td').forEach((td) => {
        if (!td.style.border || td.style.border === 'none' || td.style.border === '0px') {
          td.style.border = '0';
        }
      });
    }
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/**
 * Inserts missing Kit variables into the template in the most natural positions
 */
export function injectKitVariable(html: string, variable: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (variable === '{{ message_content }}') {
    // Insert into main content area or before footer
    const mainTd = doc.querySelector('td[style*="line-height"]') || doc.querySelector('table[style*="max-width"]') || doc.body;
    const contentBlock = doc.createElement('div');
    contentBlock.setAttribute('style', 'margin: 20px 0; font-size: 15px; line-height: 24px; color: #334155;');
    contentBlock.innerHTML = '{{ message_content }}';
    mainTd.appendChild(contentBlock);
  } else if (variable === '{{ unsubscribe_url }}' || variable === '{{ unsubscribe_link }}') {
    // Append to footer
    const footerTd = doc.querySelector('td[style*="background-color: #f8fafc"]') || doc.querySelector('footer') || doc.body;
    const p = doc.createElement('p');
    p.setAttribute('style', 'margin-top: 10px; font-size: 12px; color: #94a3b8;');
    p.innerHTML = '<a href="{{ unsubscribe_url }}" style="color: #6366f1; text-decoration: underline;">Se désabonner</a>';
    footerTd.appendChild(p);
  } else if (variable === '{{ address }}') {
    const footerTd = doc.querySelector('td[style*="background-color: #f8fafc"]') || doc.querySelector('footer') || doc.body;
    const p = doc.createElement('p');
    p.setAttribute('style', 'margin-top: 6px; font-size: 11px; color: #94a3b8;');
    p.innerHTML = '{{ address }}';
    footerTd.appendChild(p);
  }

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
