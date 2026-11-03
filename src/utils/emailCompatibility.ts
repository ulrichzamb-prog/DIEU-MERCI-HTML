import { CompatibilityIssue } from '../types/editor';

export interface AuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  issues: CompatibilityIssue[];
  metrics: {
    totalImages: number;
    imagesWithAlt: number;
    tablesCount: number;
    hasConditionalComments: boolean;
    characterCount: number;
    estimatedKb: number;
    isOverGmailClippingLimit: boolean; // 102 KB limit in Gmail
  };
}

export function auditEmailHtml(html: string): AuditResult {
  const issues: CompatibilityIssue[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Check total size for Gmail 102 KB clipping
  const charCount = html.length;
  const estimatedKb = Math.round((charCount / 1024) * 10) / 10;
  const isOverGmailClippingLimit = estimatedKb > 102;

  if (isOverGmailClippingLimit) {
    issues.push({
      severity: 'error',
      title: 'Dépassement de la limite Gmail (102 Ko)',
      description: `Le fichier pèse ${estimatedKb} Ko. Gmail tronque les emails au-delà de 102 Ko et masque le bas du message avec un bouton "[Message tronqué]".`,
      recommendation: 'Réduisez la quantité de CSS superflu ou compressez les styles pour rester sous 100 Ko.',
      affectedClients: ['Gmail Web', 'Gmail iOS', 'Gmail Android'],
    });
  }

  // 2. Check images without alt or explicit dimensions
  const images = Array.from(doc.querySelectorAll('img'));
  let imagesWithAlt = 0;
  let missingAltCount = 0;
  let missingDimensionCount = 0;

  images.forEach((img) => {
    if (img.getAttribute('alt') && img.getAttribute('alt')!.trim().length > 0) {
      imagesWithAlt++;
    } else {
      missingAltCount++;
    }

    if (!img.getAttribute('width') && !img.style.width) {
      missingDimensionCount++;
    }
  });

  if (missingAltCount > 0) {
    issues.push({
      severity: 'warning',
      title: `${missingAltCount} image(s) sans texte alternatif (alt)`,
      description: 'Les lecteurs d\'écran et les clients de messagerie avec chargement des images désactivé afficheront un cadre vide sans description.',
      recommendation: 'Renseignez un attribut alt explicite pour chaque image importante, ou laissez alt="" pour les visuels purement décoratifs.',
      affectedClients: ['Tous les clients (Accessibilité & Filtres Anti-Spam)'],
    });
  }

  if (missingDimensionCount > 0) {
    issues.push({
      severity: 'warning',
      title: `${missingDimensionCount} image(s) sans largeur explicite`,
      description: 'Outlook Desktop ignore le CSS max-width et affichera les images dans leur résolution native, provoquant l\'éclatement de la mise en page.',
      recommendation: 'Ajoutez toujours l\'attribut HTML width="..." sur chaque balise <img>.',
      affectedClients: ['Outlook 2016', 'Outlook 2019', 'Outlook 2021 Desktop (Windows)'],
    });
  }

  // 3. Check for unsupported layout properties (flexbox, grid)
  const allElements = Array.from(doc.querySelectorAll('*'));
  let flexCount = 0;
  let gridCount = 0;
  let fixedPosCount = 0;

  allElements.forEach((el) => {
    const style = (el.getAttribute('style') || '').toLowerCase();
    if (style.includes('display: flex') || style.includes('display:flex')) flexCount++;
    if (style.includes('display: grid') || style.includes('display:grid')) gridCount++;
    if (style.includes('position: fixed') || style.includes('position:fixed')) fixedPosCount++;
  });

  if (flexCount > 0) {
    issues.push({
      severity: 'warning',
      title: 'Utilisation de display: flex détectée',
      description: 'Flexbox n\'est pas supporté par Outlook pour Windows et certaines versions de Gmail Android.',
      recommendation: 'Privilégiez les tableaux <table> imbriqués avec <td> pour les colonnes côte à côte.',
      affectedClients: ['Outlook Desktop', 'Yahoo Mail Android'],
    });
  }

  if (gridCount > 0) {
    issues.push({
      severity: 'error',
      title: 'Utilisation de CSS Grid détectée',
      description: 'CSS Grid n\'est supporté par quasiment aucun client de messagerie majeur.',
      recommendation: 'Remplacez les grilles CSS par des tableaux HTML multi-colonnes.',
      affectedClients: ['Outlook', 'Gmail', 'Yahoo', 'Outlook.com'],
    });
  }

  if (fixedPosCount > 0) {
    issues.push({
      severity: 'error',
      title: 'Position fixe (position: fixed) interdite',
      description: 'La position fixe est systématiquement neutralisée par les webmails et perturbe l\'affichage.',
      recommendation: 'Utilisez un flux normal de document ou des marges.',
      affectedClients: ['Tous les clients email'],
    });
  }

  // 4. Check for layout tables missing role="presentation"
  const tables = Array.from(doc.querySelectorAll('table'));
  let missingPresentationRole = 0;
  tables.forEach((t) => {
    if (t.getAttribute('role') !== 'presentation') {
      missingPresentationRole++;
    }
  });

  if (missingPresentationRole > 0 && tables.length > 0) {
    issues.push({
      severity: 'info',
      title: `${missingPresentationRole} tableau(x) sans role="presentation"`,
      description: 'Pour les lecteurs d\'écran, les tableaux de mise en page sans role="presentation" sont lus comme des tableaux de données (colonnes et cellules répétées oralement).',
      recommendation: 'Ajoutez role="presentation" et cellspacing="0" cellpadding="0" border="0" sur les tables.',
      affectedClients: ['Accessibilité / Screen Readers (VoiceOver, NVDA, JAWS)'],
    });
  }

  // 5. Check for MSO conditional comments
  const hasConditionalComments = html.includes('<!--[if mso]>') || html.includes('<!--[if (gte mso 9)');

  // Score calculation
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === 'error') score -= 25;
    if (issue.severity === 'warning') score -= 10;
    if (issue.severity === 'info') score -= 3;
  });
  score = Math.max(10, Math.min(100, score));

  let grade: 'A' | 'B' | 'C' | 'D' = 'A';
  if (score < 60) grade = 'D';
  else if (score < 75) grade = 'C';
  else if (score < 90) grade = 'B';

  return {
    score,
    grade,
    issues,
    metrics: {
      totalImages: images.length,
      imagesWithAlt,
      tablesCount: tables.length,
      hasConditionalComments,
      characterCount: charCount,
      estimatedKb,
      isOverGmailClippingLimit,
    },
  };
}

/**
 * Automatically applies email compatibility enhancements to raw HTML
 */
export function autoFixEmailCompatibility(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Fix tables
  const tables = doc.querySelectorAll('table');
  tables.forEach((table) => {
    if (!table.getAttribute('role')) table.setAttribute('role', 'presentation');
    if (!table.getAttribute('cellpadding')) table.setAttribute('cellpadding', '0');
    if (!table.getAttribute('cellspacing')) table.setAttribute('cellspacing', '0');
    if (!table.getAttribute('border')) table.setAttribute('border', '0');
  });

  // Fix images
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.getAttribute('alt')) img.setAttribute('alt', '');
    if (!img.style.display) img.style.display = 'block';
    if (!img.getAttribute('border')) img.setAttribute('border', '0');
    
    // Add explicit width if style.width is specified in px
    if (!img.getAttribute('width') && img.style.width && img.style.width.endsWith('px')) {
      const widthVal = parseInt(img.style.width, 10);
      if (!isNaN(widthVal)) {
        img.setAttribute('width', String(widthVal));
      }
    }
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
