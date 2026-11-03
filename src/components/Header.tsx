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
  Check
} from 'lucide-react';
import { WorkspaceMode } from '../types/editor';

interface HeaderProps {
  currentMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenImport: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
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
  onOpenImport,
  onOpenTemplates,
  onOpenExport,
  isSaved,
  documentTitle,
}) => {
  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between gap-6 shrink-0 z-30 select-none">
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

        <span className="text-xs font-medium text-neutral-300 max-w-[180px] truncate" title={documentTitle}>
          {documentTitle}
        </span>

        {isSaved ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <Check className="w-3 h-3" /> Auto-sauvegardé
          </span>
        ) : (
          <span className="text-[11px] text-amber-400 font-medium">
            Modifications non enregistrées
          </span>
        )}
      </div>

      {/* Zone 2: 3 Core Workspace Modes (Segmented Tab Bar) */}
      <div className="flex items-center p-1 bg-neutral-950/80 rounded-lg border border-neutral-800">
        <button
          onClick={() => onModeChange('visual')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'visual'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Édition Visuelle Directe (Canvas Canva-style)"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Édition Visuelle</span>
        </button>

        <button
          onClick={() => onModeChange('code')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'code'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Édition Directe du Code Source HTML Synchronisé"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Code HTML</span>
        </button>

        <button
          onClick={() => onModeChange('preview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            currentMode === 'preview'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Aperçu Client Email Réel (Gmail, Outlook, Dark Mode)"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Aperçu Final</span>
        </button>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-neutral-800 transition-colors"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-neutral-800 transition-colors"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Picker */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 hover:text-white border border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap"
          title="Choisir parmi nos modèles prêts"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
          <span>Modèles</span>
        </button>

        {/* Import Hub */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 hover:text-white border border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap"
          title="Importer du HTML, PDF, Image ou Word DOCX"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Importer</span>
        </button>

        {/* Export CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap active:scale-[0.98]"
          title="Télécharger l'HTML, copier le code ou exporter en PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter</span>
        </button>
      </div>
    </header>
  );
};
