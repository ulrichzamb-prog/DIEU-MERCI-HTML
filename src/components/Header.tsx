import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Upload, 
  Download, 
  LayoutTemplate, 
  Code2, 
  Eye, 
  Palette,
  Check,
  FilePlus2,
  ArrowRightLeft,
  Cloud,
  Send
} from 'lucide-react';
import { WorkspaceMode } from '../types/editor';

interface HeaderProps {
  currentMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewProject: () => void;
  onOpenImport: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenKitModal: () => void;
  onOpenPeaceLoveConvert: () => void;
  onOpenCloudinary: () => void;
  isSaved: boolean;
  documentTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewProject,
  onOpenImport,
  onOpenTemplates,
  onOpenExport,
  onOpenKitModal,
  onOpenPeaceLoveConvert,
  onOpenCloudinary,
  isSaved,
  documentTitle,
}) => {
  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between gap-4 shrink-0 z-30 select-none">
      {/* Zone 1: Brand & Document Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-indigo-500/20">
            ✉
          </div>
          <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
            Courrier Studio
          </span>
        </div>

        <span className="text-neutral-600">/</span>

        <span className="text-xs font-medium text-neutral-300 max-w-[150px] truncate" title={documentTitle}>
          {documentTitle}
        </span>

        {isSaved ? (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <Check className="w-3 h-3" /> Sauvegardé
          </span>
        ) : (
          <span className="hidden md:inline text-[11px] text-amber-400 font-medium">
            Modifié
          </span>
        )}
      </div>

      {/* Zone 2: 3 Core Workspace Modes (Segmented Tab Bar) */}
      <div className="flex items-center p-1 bg-neutral-950/80 rounded-lg border border-neutral-800">
        <button
          onClick={() => onModeChange('visual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'visual'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Édition Visuelle Directe (Canvas Canva-style)"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Édition Visuelle</span>
        </button>

        <button
          onClick={() => onModeChange('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'code'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Édition Directe du Code Source HTML Synchronisé"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Code HTML</span>
        </button>

        <button
          onClick={() => onModeChange('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'preview'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Aperçu Client Email Réel (Gmail, Outlook, Dark Mode)"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Aperçu Final</span>
        </button>
      </div>

      {/* Zone 3: Actions, Tools & Modules */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* New Project */}
        <button
          onClick={onNewProject}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Nouveau Projet (Créer une page vierge)"
        >
          <FilePlus2 className="w-4 h-4" />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-neutral-800 transition-colors"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-neutral-800 transition-colors"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

        {/* Module 1: peaceloveconvert */}
        <button
          onClick={onOpenPeaceLoveConvert}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-pink-300 bg-pink-950/40 hover:bg-pink-950/70 border border-pink-800/50 rounded-lg transition-all whitespace-nowrap"
          title="Module peaceloveconvert : Conversion de documents & OCR multilingue"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden lg:inline">peaceloveconvert</span>
        </button>

        {/* Module 2: Cloudinary */}
        <button
          onClick={onOpenCloudinary}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/50 rounded-lg transition-all whitespace-nowrap"
          title="Hébergement Cloudinary : Téléversement sécurisé et URLs publiques HTTPS"
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">Cloudinary</span>
        </button>

        {/* Module 3: Kit (ConvertKit) */}
        <button
          onClick={onOpenKitModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-orange-300 bg-orange-950/40 hover:bg-orange-950/70 border border-orange-800/50 rounded-lg transition-all whitespace-nowrap"
          title="Module Kit : Optimisation des tableaux de structure & variables ConvertKit"
        >
          <Send className="w-3.5 h-3.5 text-orange-400" />
          <span>Préparer pour Kit</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

        {/* Import */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-750 hover:text-white rounded-lg transition-colors whitespace-nowrap"
          title="Importer du HTML, PDF, Image ou Word DOCX"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Importer</span>
        </button>

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-750 hover:text-white rounded-lg transition-colors whitespace-nowrap"
          title="Modèles Prêts"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Modèles</span>
        </button>

        {/* Export CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap active:scale-[0.98]"
          title="Télécharger HTML, DOCX, PDF ou ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter</span>
        </button>
      </div>
    </header>
  );
};
