import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  Download, 
  Archive, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Monitor, 
  Smartphone, 
  Plus, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { 
  auditForKit, 
  adaptHtmlForKit, 
  injectKitVariable, 
  KitAuditReport 
} from '../../utils/kitEmailAdapter';
import { createEmailZipPackage } from '../../utils/zipExporter';
import { EmailMetadata } from '../../types/editor';

interface KitExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  metadata: EmailMetadata;
  onApplyKitOptimizationsToDocument: (optimizedHtml: string) => void;
}

export const KitExportModal: React.FC<KitExportModalProps> = ({
  isOpen,
  onClose,
  html,
  metadata,
  onApplyKitOptimizationsToDocument,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [currentHtml, setCurrentHtml] = useState<string>(html);
  const [report, setReport] = useState<KitAuditReport>(() => auditForKit(html));

  React.useEffect(() => {
    setCurrentHtml(html);
    setReport(auditForKit(html));
  }, [html]);

  if (!isOpen) return null;

  // Insert a missing variable in 1-click
  const handleInsertVariable = (variable: string) => {
    const updated = injectKitVariable(currentHtml, variable);
    setCurrentHtml(updated);
    setReport(auditForKit(updated));
  };

  // Optimize structural tables and clean for Kit
  const handleAutoOptimizeForKit = () => {
    let optimized = adaptHtmlForKit(currentHtml);
    // If message_content missing, insert it
    if (!report.hasMessageContent) {
      optimized = injectKitVariable(optimized, '{{ message_content }}');
    }
    // If unsubscribe missing, insert it
    if (!report.hasUnsubscribe) {
      optimized = injectKitVariable(optimized, '{{ unsubscribe_url }}');
    }
    setCurrentHtml(optimized);
    setReport(auditForKit(optimized));
  };

  // Copy Kit HTML to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Kit HTML file
  const handleDownloadHtml = () => {
    const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-kit-convertkit.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download ZIP with HTML + images
  const handleDownloadZip = async () => {
    const zipBlob = await createEmailZipPackage(currentHtml, metadata, 'template-kit');
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-kit-package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Apply changes to the main editor document
  const handleApplyToEditor = () => {
    onApplyKitOptimizationsToDocument(currentHtml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Module Export Email pour Kit (ConvertKit)
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  report.isValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                }`}>
                  {report.isValid ? 'Prêt pour Kit' : 'Erreurs critiques à corriger'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Adaptation automatique des tableaux de structure, préservation des balises et conformité Kit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout: 2 Columns (Audit & Variables on Left, Interactive Preview on Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Audit & Variable Controls */}
          <div className="w-1/2 p-5 border-r border-neutral-800 overflow-y-auto space-y-4">
            {/* Score & Summary Card */}
            <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300">Score de Compatibilité Kit</span>
                <span className={`text-base font-mono font-bold ${report.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {report.score}/100
                </span>
              </div>

              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    report.score >= 80 ? 'bg-emerald-500' : report.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${report.score}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono">
                <div>Tableaux structure : <span className="text-neutral-200">{report.structuralTablesOptimized}</span></div>
                <div>Tableaux de données : <span className="text-neutral-200">{report.dataTablesPreserved}</span></div>
              </div>

              <button
                onClick={handleAutoOptimizeForKit}
                className="mt-3 w-full py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Optimiser automatiquement les tableaux & variables</span>
              </button>
            </div>

            {/* Kit Variables Status */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Variables Kit (ConvertKit)
              </div>
              <div className="space-y-2">
                {/* message_content */}
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-semibold text-white">{'{{ message_content }}'}</div>
                    <div className="text-[10px] text-neutral-500">Zone de contenu dynamique</div>
                  </div>
                  {report.hasMessageContent ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Présente
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInsertVariable('{{ message_content }}')}
                      className="px-2 py-1 bg-neutral-800 hover:bg-orange-600 text-neutral-200 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insérer</span>
                    </button>
                  )}
                </div>

                {/* unsubscribe_url */}
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-semibold text-white">{'{{ unsubscribe_url }}'}</div>
                    <div className="text-[10px] text-neutral-500">Lien de désinscription obligatoire</div>
                  </div>
                  {report.hasUnsubscribe ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Présente
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInsertVariable('{{ unsubscribe_url }}')}
                      className="px-2 py-1 bg-neutral-800 hover:bg-orange-600 text-neutral-200 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insérer</span>
                    </button>
                  )}
                </div>

                {/* address */}
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-semibold text-white">{'{{ address }}'}</div>
                    <div className="text-[10px] text-neutral-500">Adresse postale d'expéditeur</div>
                  </div>
                  {report.hasAddress ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Présente
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInsertVariable('{{ address }}')}
                      className="px-2 py-1 bg-neutral-800 hover:bg-orange-600 text-neutral-200 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insérer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Issues Checklist */}
            {report.issues.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Rapport de Conformité ({report.issues.length})
                </div>
                <div className="space-y-1.5">
                  {report.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-xs border ${
                        issue.type === 'error'
                          ? 'bg-red-950/30 border-red-800/40 text-red-200'
                          : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {issue.type === 'error' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{issue.title}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Responsive Preview & Kit Export Actions */}
          <div className="w-1/2 p-5 flex flex-col bg-neutral-950/40">
            {/* Viewport switch */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-neutral-300">Aperçu Rendu Kit</span>
              <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded transition-colors ${
                    previewDevice === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                  }`}
                  title="Aperçu Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded transition-colors ${
                    previewDevice === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                  }`}
                  title="Aperçu Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 bg-white rounded-lg overflow-hidden border border-neutral-800 flex justify-center">
              <iframe
                srcDoc={currentHtml}
                title="Aperçu Kit"
                className="h-full border-0 transition-all duration-200"
                style={{ width: previewDevice === 'mobile' ? '375px' : '100%' }}
                sandbox="allow-same-origin"
              />
            </div>

            {/* Export buttons */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier HTML Kit'}</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger .HTML</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadZip}
                  className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Télécharger Kit ZIP</span>
                </button>

                <button
                  onClick={handleApplyToEditor}
                  className="py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Appliquer au Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
