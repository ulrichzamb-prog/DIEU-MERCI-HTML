import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileCode, 
  FileText, 
  Image as ImageIcon, 
  FileType, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { sanitizeAndTagHtml } from '../../utils/htmlSanitizer';
import { convertDocxToEmailHtml } from '../../utils/docxImporter';
import { convertPdfToEmailHtml } from '../../utils/pdfImporter';
import { reconstructImageToEmailHtml } from '../../utils/imageReconstructor';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (html: string, docName: string) => void;
}

type ImportTab = 'paste' | 'html-file' | 'pdf' | 'image' | 'docx';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [activeTab, setActiveTab] = useState<ImportTab>('paste');
  const [pastedHtml, setPastedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image import specific options
  const [imagePreview, setImagePreview] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);
  const [imageType, setImageType] = useState<'hero' | 'logo' | 'creative'>('hero');
  const [imageTitle, setImageTitle] = useState<string>('Nouveau Visuel');
  const [imageCta, setImageCta] = useState<string>('Découvrir');

  if (!isOpen) return null;

  // 1. Paste HTML
  const handleImportPasted = () => {
    if (!pastedHtml.trim()) {
      setErrorMessage('Veuillez coller un code HTML valide.');
      return;
    }

    try {
      const { sanitizedHtml, elementCount } = sanitizeAndTagHtml(pastedHtml);
      onImportSuccess(sanitizedHtml, 'HTML Collé');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de l\'analyse du HTML.');
    }
  };

  // 2. HTML File
  const handleHtmlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const text = await file.text();
      const { sanitizedHtml } = sanitizeAndTagHtml(text);
      onImportSuccess(sanitizedHtml, file.name);
      onClose();
    } catch (err: any) {
      setErrorMessage('Erreur lors de la lecture du fichier HTML.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Word DOCX
  const handleDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const emailHtml = await convertDocxToEmailHtml(arrayBuffer, file.name);
      const { sanitizedHtml } = sanitizeAndTagHtml(emailHtml);
      onImportSuccess(sanitizedHtml, file.name);
      onClose();
    } catch (err: any) {
      setErrorMessage('Impossible d\'extraire le document Word DOCX.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. PDF File
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const emailHtml = await convertPdfToEmailHtml(arrayBuffer, file.name);
      const { sanitizedHtml } = sanitizeAndTagHtml(emailHtml);
      onImportSuccess(sanitizedHtml, file.name);
      onClose();
    } catch (err: any) {
      setErrorMessage('Erreur lors du traitement du document PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Image File (JPG, PNG, WEBP)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImagePreview({
          dataUrl,
          width: img.naturalWidth || 600,
          height: img.naturalHeight || 400,
          fileName: file.name,
        });
        setImageTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmImageImport = () => {
    if (!imagePreview) return;

    const emailHtml = reconstructImageToEmailHtml({
      fileName: imagePreview.fileName,
      dataUrl: imagePreview.dataUrl,
      width: imagePreview.width,
      height: imagePreview.height,
      imageType,
      title: imageTitle,
      ctaText: imageCta,
    });

    const { sanitizedHtml } = sanitizeAndTagHtml(emailHtml);
    onImportSuccess(sanitizedHtml, imagePreview.fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Importer un Document ou Code</h2>
              <p className="text-xs text-neutral-400">
                HTML existant, PDF, Image (JPG/PNG/WEBP) ou Word DOCX
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

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Coller du Code HTML</span>
          </button>

          <button
            onClick={() => { setActiveTab('html-file'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'html-file'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileType className="w-3.5 h-3.5" />
            <span>Fichier .html</span>
          </button>

          <button
            onClick={() => { setActiveTab('pdf'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>Document PDF</span>
          </button>

          <button
            onClick={() => { setActiveTab('image'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'image'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Image (JPG / PNG)</span>
          </button>

          <button
            onClick={() => { setActiveTab('docx'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'docx'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Word DOCX</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Paste HTML */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Collez le code source HTML de votre email ci-dessous :
                </label>
                <textarea
                  rows={10}
                  value={pastedHtml}
                  onChange={(e) => setPastedHtml(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-indigo-500"
                  placeholder="<!DOCTYPE html><html><body>...</body></html>"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImportPasted}
                  disabled={!pastedHtml.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg shadow-sm transition-all"
                >
                  Analyser & Ouvrir dans l'Éditeur
                </button>
              </div>
            </div>
          )}

          {/* 2. HTML File */}
          {activeTab === 'html-file' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center">
                <FileCode className="w-10 h-10 text-indigo-400 mb-3" />
                <span className="text-sm font-semibold text-neutral-200">
                  Cliquez pour sélectionner un fichier .html ou .htm
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  Les styles inline, tableaux et structures d'origine seront intégralement préservés.
                </span>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleHtmlFileUpload}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Traitement du fichier HTML en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* 3. PDF File */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-red-500 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center">
                <FileText className="w-10 h-10 text-red-400 mb-3" />
                <span className="text-sm font-semibold text-neutral-200">
                  Sélectionnez un document PDF (.pdf)
                </span>
                <span className="text-xs text-neutral-500 mt-1 max-w-md">
                  Extraction fidèle du texte et des éléments graphiques (logos, signatures, mise en page) sans distorsion ni remplacement IA.
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileUpload}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-red-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extraction haute fidélité du PDF en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* 4. Image File (JPG, PNG, WEBP) */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center">
                  <ImageIcon className="w-10 h-10 text-emerald-400 mb-3" />
                  <span className="text-sm font-semibold text-neutral-200">
                    Sélectionnez une image JPG, PNG, WEBP
                  </span>
                  <span className="text-xs text-neutral-500 mt-1">
                    Conservation absolue des dimensions, proportions d'origine et fidélité graphique.
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 items-start bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <img
                      src={imagePreview.dataUrl}
                      alt="Aperçu"
                      className="w-24 h-24 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-white">{imagePreview.fileName}</div>
                      <div className="text-neutral-500 font-mono mt-0.5">
                        {imagePreview.width} &times; {imagePreview.height} px
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        &check; Proportions et fidélité 100% conservées
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Type d'élément</label>
                      <select
                        value={imageType}
                        onChange={(e) => setImageType(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="hero">Visuel Hero Banner / Créatif</option>
                        <option value="logo">Logo d'En-tête de Marque</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Titre de l'email</label>
                      <input
                        type="text"
                        value={imageTitle}
                        onChange={(e) => setImageTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setImagePreview(null)}
                      className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                    >
                      Changer d'image
                    </button>
                    <button
                      onClick={handleConfirmImageImport}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                    >
                      Reconstruire l'Email avec cette Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Word DOCX */}
          {activeTab === 'docx' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-sky-500 rounded-xl cursor-pointer bg-neutral-950/40 hover:bg-neutral-950 transition-all text-center">
                <FileText className="w-10 h-10 text-sky-400 mb-3" />
                <span className="text-sm font-semibold text-neutral-200">
                  Sélectionnez un document Word (.docx)
                </span>
                <span className="text-xs text-neutral-500 mt-1 max-w-md">
                  Conversion automatique des paragraphes, titres, tableaux et liens en format email 600px responsive.
                </span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocxFileUpload}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-sky-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conversion du document Word en cours...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
