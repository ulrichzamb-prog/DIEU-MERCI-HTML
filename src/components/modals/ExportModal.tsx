import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Image as ImageIcon, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cleanHtmlForExport } from '../../utils/htmlSanitizer';
import { autoFixEmailCompatibility } from '../../utils/emailCompatibility';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  documentTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  html,
  documentTitle,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [autoOptimized, setAutoOptimized] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generate production-ready HTML
  const getExportCode = () => {
    let clean = cleanHtmlForExport(html);
    if (autoOptimized) {
      clean = autoFixEmailCompatibility(clean);
    }
    return clean;
  };

  const handleCopyCode = () => {
    const code = getExportCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const code = getExportCode();
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = (documentTitle || 'template-email').toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `${sanitizedTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      // Create temporary iframe to render cleanly
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '600px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(getExportCode());
        doc.close();

        // Wait for images to load
        await new Promise((resolve) => setTimeout(resolve, 600));

        const canvas = await html2canvas(doc.body, { scale: 1.5 });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${documentTitle || 'email-preview'}.pdf`);
      }
      document.body.removeChild(iframe);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '600px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(getExportCode());
        doc.close();

        await new Promise((resolve) => setTimeout(resolve, 600));

        const canvas = await html2canvas(doc.body, { scale: 2 });
        const imgUrl = canvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = `${documentTitle || 'email-preview'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      document.body.removeChild(iframe);
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Exporter le Template Email</h2>
              <p className="text-xs text-neutral-400">Prêt pour l'envoi sur Gmail, Outlook, Brevo, Mailchimp</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Optimization Toggle */}
          <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Optimisation automatique pour la délivrabilité
                </div>
                <div className="text-[11px] text-neutral-400">
                  Nettoie les attributs internes de l'éditeur et garantit la compatibilité Outlook 2016-2021.
                </div>
              </div>
            </div>

            <button
              onClick={() => setAutoOptimized(!autoOptimized)}
              className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center ${
                autoOptimized ? 'bg-indigo-600 justify-end' : 'bg-neutral-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Download HTML */}
            <button
              onClick={handleDownloadHtml}
              className="flex flex-col items-center justify-center p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-indigo-500/60 rounded-xl transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mb-0.5">Télécharger .HTML</span>
              <span className="text-[10px] text-neutral-400">Code prêt pour vos campagnes</span>
            </button>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyCode}
              className="flex flex-col items-center justify-center p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/60 rounded-xl transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <span className="text-xs font-bold text-white mb-0.5">
                {copied ? 'Copié dans le presse-papiers !' : 'Copier le Code Source'}
              </span>
              <span className="text-[10px] text-neutral-400">Collable directement dans votre CMS</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex flex-col items-center justify-center p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-red-500/60 rounded-xl transition-all text-center group disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-lg bg-red-950/80 text-red-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mb-0.5">
                {isExportingPdf ? 'Génération du PDF...' : 'Télécharger l\'Aperçu PDF'}
              </span>
              <span className="text-[10px] text-neutral-400">Idéal pour validation client</span>
            </button>

            {/* Export PNG */}
            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="flex flex-col items-center justify-center p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-sky-500/60 rounded-xl transition-all text-center group disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-950/80 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mb-0.5">
                {isExportingPng ? 'Capture HD...' : 'Télécharger Capture PNG'}
              </span>
              <span className="text-[10px] text-neutral-400">Rendu haute résolution</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Courrier Studio &bull; Standard Email HTML universel</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
