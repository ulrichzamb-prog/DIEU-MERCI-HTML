import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Upload, 
  FileText, 
  Check, 
  Download, 
  Trash2, 
  Sparkles, 
  Copy, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileCode,
  Archive,
  ArrowRight
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  getAvailableTargetFormats, 
  getFileExtension, 
  executeFileConversion, 
  runOcrRecognition,
  formatOcrToEmailHtml
} from '../../utils/converterEngine';
import { exportHtmlToDocx } from '../../utils/docxExporter';

interface FileQueueItem {
  id: string;
  file: File;
  targetFormat: string;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultFilename?: string;
  error?: string;
}

interface PeaceLoveConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertOcrTextToEmail?: (text: string) => void;
  onLoadHtmlToEditor?: (html: string, title: string) => void;
}

export const PeaceLoveConvertModal: React.FC<PeaceLoveConvertModalProps> = ({
  isOpen,
  onClose,
  onInsertOcrTextToEmail,
  onLoadHtmlToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'convert' | 'ocr'>('convert');

  // Convert tab state
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isConvertingBatch, setIsConvertingBatch] = useState<boolean>(false);

  // OCR tab state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<'fra' | 'eng' | 'spa' | 'por' | 'deu'>('fra');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [ocrIsRunning, setOcrIsRunning] = useState<boolean>(false);
  const [ocrResultText, setOcrResultText] = useState<string>('');
  const [ocrCopied, setOcrCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle files dropped or selected for conversion
  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;

    const newItems: FileQueueItem[] = [];
    Array.from(files).forEach((file) => {
      const available = getAvailableTargetFormats(file.name);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        targetFormat: available[0] || 'txt',
        status: 'idle',
        progress: 0,
      });
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  // Convert a single item
  const convertSingleItem = async (item: FileQueueItem) => {
    setFileQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'converting', progress: 10 } : i))
    );

    try {
      const { blob, filename } = await executeFileConversion(
        item.file,
        item.targetFormat,
        (progress) => {
          setFileQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
          );
        }
      );

      setFileQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                resultBlob: blob,
                resultFilename: filename,
              }
            : i
        )
      );
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                error: err?.message || 'Erreur lors de la conversion',
              }
            : i
        )
      );
    }
  };

  // Convert all items in queue
  const handleConvertAll = async () => {
    setIsConvertingBatch(true);
    for (const item of fileQueue) {
      if (item.status !== 'completed') {
        await convertSingleItem(item);
      }
    }
    setIsConvertingBatch(false);
  };

  // Download converted file
  const handleDownloadSingle = (item: FileQueueItem) => {
    if (!item.resultBlob || !item.resultFilename) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download all completed as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = fileQueue.filter((i) => i.status === 'completed' && i.resultBlob);
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    for (const item of completedItems) {
      if (item.resultBlob && item.resultFilename) {
        zip.file(item.resultFilename, item.resultBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversions-peaceloveconvert-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run OCR
  const handleStartOcr = async () => {
    if (!ocrFile) return;
    setOcrIsRunning(true);
    setOcrResultText('');
    setOcrProgress(5);

    try {
      const text = await runOcrRecognition(ocrFile, ocrLanguage, (prog, status) => {
        setOcrProgress(prog);
        setOcrStatusText(status);
      });
      setOcrResultText(text);
    } catch (err: any) {
      setOcrStatusText(`Erreur OCR: ${err?.message || 'Échec de lecture'}`);
    } finally {
      setOcrIsRunning(false);
    }
  };

  // Export OCR to DOCX
  const handleExportOcrDocx = async () => {
    if (!ocrResultText) return;
    const html = ocrResultText.split('\n\n').map((p) => `<p>${p}</p>`).join('');
    const docxBlob = await exportHtmlToDocx(html, ocrFile?.name || 'Document OCR');
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(ocrFile?.name || 'ocr-result').replace(/\.[^/.]+$/, '')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  peaceloveconvert
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800/60 font-semibold">
                  Documents &bull; Images &bull; OCR
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Conversions réelles multiformats (PDF, DOCX, XLSX, Images, ZIP) sans aucune limite payante
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

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2 gap-3">
          <button
            onClick={() => setActiveTab('convert')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'convert'
                ? 'border-pink-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-pink-400" />
            <span>Convertisseur de Fichiers ({fileQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ocr'
                ? 'border-pink-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Moteur OCR Multilingue (Tesseract)</span>
          </button>
        </div>

        {/* Tab 1: Multi-format Converter */}
        {activeTab === 'convert' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Drag & Drop Zone */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 hover:border-pink-500/80 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center group">
              <Upload className="w-8 h-8 text-neutral-400 group-hover:text-pink-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-neutral-200">
                Glissez-déposez ou sélectionnez vos fichiers à convertir
              </span>
              <span className="text-[11px] text-neutral-500 mt-1">
                Documents (PDF, DOCX, TXT), Tableurs (XLSX, CSV, ODS), Images (JPG, PNG, WEBP), Archives (ZIP)
              </span>
              <input
                type="file"
                multiple
                onChange={(e) => handleFilesAdded(e.target.files)}
                className="hidden"
              />
            </label>

            {/* Queue List */}
            {fileQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>File d'attente ({fileQueue.length} fichier{fileQueue.length > 1 ? 's' : ''})</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFileQueue([])}
                      className="text-neutral-500 hover:text-red-400 text-[11px] transition-colors"
                    >
                      Tout effacer
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {fileQueue.map((item) => {
                    const ext = getFileExtension(item.file.name);
                    const targets = getAvailableTargetFormats(item.file.name);

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate max-w-[220px]">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              ({(item.file.size / 1024).toFixed(1)} Ko)
                            </span>
                          </div>

                          {/* Progress bar */}
                          {item.status === 'converting' && (
                            <div className="mt-1.5 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-pink-500 h-full rounded-full transition-all duration-200"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          )}

                          {item.error && (
                            <div className="text-[10px] text-red-400 mt-1">{item.error}</div>
                          )}
                        </div>

                        {/* Format selector */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-neutral-500 uppercase font-mono">{ext}</span>
                          <span className="text-neutral-600">&rarr;</span>
                          <select
                            value={item.targetFormat}
                            disabled={item.status === 'converting' || item.status === 'completed'}
                            onChange={(e) => {
                              const newFmt = e.target.value;
                              setFileQueue((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, targetFormat: newFmt } : i))
                              );
                            }}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white uppercase font-mono font-semibold"
                          >
                            {targets.map((fmt) => (
                              <option key={fmt} value={fmt}>
                                {fmt.toUpperCase()}
                              </option>
                            ))}
                          </select>

                          {/* Action / Status */}
                          {item.status === 'completed' ? (
                            <div className="flex items-center gap-1.5">
                              {item.targetFormat === 'html' && onLoadHtmlToEditor && (
                                <button
                                  onClick={async () => {
                                    if (item.resultBlob) {
                                      const text = await item.resultBlob.text();
                                      onLoadHtmlToEditor(text, item.file.name);
                                      onClose();
                                    }
                                  }}
                                  className="px-2 py-1 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/80 rounded transition-colors flex items-center gap-1 font-semibold text-[11px]"
                                  title="Charger directement dans l'éditeur visuel d'emails"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Ouvrir dans l'éditeur</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadSingle(item)}
                                className="p-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/80 rounded transition-colors flex items-center gap-1 font-medium text-[11px]"
                                title="Télécharger le fichier converti"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Télécharger</span>
                              </button>
                            </div>
                          ) : item.status === 'converting' ? (
                            <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                          ) : (
                            <button
                              onClick={() => convertSingleItem(item)}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-pink-600 text-neutral-200 hover:text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              Convertir
                            </button>
                          )}

                          <button
                            onClick={() => setFileQueue((prev) => prev.filter((i) => i.id !== item.id))}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            {fileQueue.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <button
                  onClick={handleDownloadAllZip}
                  disabled={fileQueue.filter((i) => i.status === 'completed').length === 0}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Télécharger tout en ZIP</span>
                </button>

                <button
                  onClick={handleConvertAll}
                  disabled={isConvertingBatch || fileQueue.every((i) => i.status === 'completed')}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all"
                >
                  {isConvertingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Conversion du lot en cours...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Convertir Tout le Lot</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tesseract OCR Engine */}
        {activeTab === 'ocr' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Reconnaissance Optique de Caractères (OCR)</div>
                <div className="text-[11px] text-neutral-400">
                  Extrayez le texte de photos, scans de lettres ou documents en texte éditable et réutilisable dans votre email.
                </div>
              </div>

              {/* Language selection */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-400">Langue :</label>
                <select
                  value={ocrLanguage}
                  onChange={(e) => setOcrLanguage(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-semibold"
                >
                  <option value="fra">Français (fra)</option>
                  <option value="eng">Anglais (eng)</option>
                  <option value="spa">Espagnol (spa)</option>
                  <option value="por">Portugais (por)</option>
                  <option value="deu">Allemand (deu)</option>
                </select>
              </div>
            </div>

            {/* OCR File Picker */}
            {!ocrFile ? (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-amber-500 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center group">
                <FileText className="w-8 h-8 text-neutral-400 group-hover:text-amber-400 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-neutral-200">
                  Sélectionnez une image (JPG, PNG) ou un PDF scanné à reconnaître
                </span>
                <span className="text-[11px] text-neutral-500 mt-1">
                  Traitement local et sécurisé via Tesseract.js
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setOcrFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">{ocrFile.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      ({(ocrFile.size / 1024).toFixed(1)} Ko)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setOcrFile(null);
                      setOcrResultText('');
                    }}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    Changer de fichier
                  </button>
                </div>

                {/* Progress bar */}
                {ocrIsRunning && (
                  <div className="space-y-1.5 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{ocrStatusText || 'Reconnaissance en cours...'}</span>
                      <span className="font-mono text-amber-400">{ocrProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!ocrIsRunning && ocrStatusText && ocrStatusText.startsWith('Erreur') && (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-300">Échec du traitement OCR</div>
                      <div className="text-[11px] text-red-200/90 mt-0.5">{ocrStatusText}</div>
                    </div>
                  </div>
                )}

                {!ocrResultText && !ocrIsRunning && (
                  <button
                    onClick={handleStartOcr}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer la reconnaissance OCR ({ocrLanguage.toUpperCase()})</span>
                  </button>
                )}

                {/* OCR Result View */}
                {ocrResultText && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Texte extrait ({ocrResultText.length} caractères)
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ocrResultText);
                            setOcrCopied(true);
                            setTimeout(() => setOcrCopied(false), 2000);
                          }}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] text-neutral-200 flex items-center gap-1 transition-colors"
                        >
                          {ocrCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{ocrCopied ? 'Copié' : 'Copier'}</span>
                        </button>

                        <button
                          onClick={handleExportOcrDocx}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] text-neutral-200 flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span>Exporter .DOCX</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={7}
                      value={ocrResultText}
                      onChange={(e) => setOcrResultText(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 font-sans focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {onLoadHtmlToEditor && (
                        <button
                          onClick={() => {
                            const formattedHtml = formatOcrToEmailHtml(ocrFile?.name || 'Document OCR Reconstruit', ocrResultText);
                            onLoadHtmlToEditor(formattedHtml, ocrFile?.name || 'Document OCR');
                            onClose();
                          }}
                          className="py-2 px-3 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          title="Reconstruit la mise en page et les styles typographiques dans l'éditeur"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Appliquer au document (Mise en page)</span>
                        </button>
                      )}

                      {onInsertOcrTextToEmail && (
                        <button
                          onClick={() => {
                            onInsertOcrTextToEmail(ocrResultText);
                            onClose();
                          }}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          title="Ajoute ce texte à l'emplacement actuel de l'email"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Insérer bloc dans l'email</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
