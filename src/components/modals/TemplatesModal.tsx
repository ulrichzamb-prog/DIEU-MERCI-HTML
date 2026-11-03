import React from 'react';
import { X, LayoutTemplate, ArrowRight } from 'lucide-react';
import { SAMPLE_TEMPLATES } from '../../data/sampleTemplates';
import { TemplateDefinition } from '../../types/editor';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateDefinition) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Galerie de Modèles Prêts à l'Emploi</h2>
              <p className="text-xs text-neutral-400">
                Templates professionnels entièrement compatibles avec tous les clients email
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

        {/* Templates List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {SAMPLE_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="p-4 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800 hover:border-indigo-500/60 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                  {tmpl.thumbnail}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    {tmpl.description}
                  </p>
                  <div className="text-[11px] text-neutral-500 mt-1.5">
                    <strong>Objet :</strong> {tmpl.metadata.subject}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 group-hover:text-indigo-400 shrink-0 ml-4">
                <span>Charger</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
