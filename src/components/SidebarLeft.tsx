import React, { useState } from 'react';
import { 
  PlusCircle, 
  Layers, 
  ShieldCheck, 
  Mail, 
  Heading1, 
  Heading2, 
  AlignLeft, 
  MousePointerClick, 
  Image as ImageIcon, 
  Columns, 
  Minus, 
  MoveVertical, 
  Trash2, 
  Lock, 
  Unlock, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { EmailMetadata, SelectedElementInfo } from '../types/editor';
import { AuditResult } from '../utils/emailCompatibility';

interface SidebarLeftProps {
  onInsertElement: (elementType: string) => void;
  domElements: Array<{ id: string; type: string; tagName: string; text: string; isLocked: boolean }>;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveElement: (id: string, direction: 'up' | 'down') => void;
  auditResult: AuditResult;
  onAutoFixCompatibility: () => void;
  metadata: EmailMetadata;
  onUpdateMetadata: (meta: Partial<EmailMetadata>) => void;
}

type TabType = 'elements' | 'layers' | 'audit' | 'meta';

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  onInsertElement,
  domElements,
  selectedElementId,
  onSelectElement,
  onDeleteElement,
  onToggleLock,
  onMoveElement,
  auditResult,
  onAutoFixCompatibility,
  metadata,
  onUpdateMetadata,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('elements');

  return (
    <aside className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden">
      {/* Tab Switcher Icons */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-950/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'elements' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Insérer des éléments"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Éléments</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'layers' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Arborescence & Calques"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Calques</span>
          <span className="text-[10px] text-neutral-500 font-mono">({domElements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'audit' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Audit de Compatibilité Email"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${auditResult.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>Audit</span>
          <span className={`text-[10px] font-mono px-1 rounded ${auditResult.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {auditResult.score}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'meta' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Métadonnées Email (Objet, expéditeur)"
        >
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>Email</span>
        </button>
      </div>

      {/* Tab 1: Elements Panel */}
      {activeTab === 'elements' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Typographie & Textes
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onInsertElement('heading-1')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <Heading1 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-neutral-200">Grand Titre H1</span>
              </button>

              <button
                onClick={() => onInsertElement('heading-2')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <Heading2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-neutral-200">Sous-titre H2</span>
              </button>

              <button
                onClick={() => onInsertElement('paragraph')}
                className="col-span-2 flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <AlignLeft className="w-4 h-4 text-neutral-400 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium text-neutral-200">Paragraphe de texte</div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Boutons & Médias
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onInsertElement('button')}
                className="col-span-2 flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <MousePointerClick className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">Bouton d'Action (CTA)</div>
                  <div className="text-[10px] text-neutral-500">Bouton compatible Outlook avec styles inline</div>
                </div>
              </button>

              <button
                onClick={() => onInsertElement('image')}
                className="col-span-2 flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">Image / Logo</div>
                  <div className="text-[10px] text-neutral-500">Proportions préservées et alt tag</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Mise en page & Structure
            </div>
            <div className="space-y-2">
              <button
                onClick={() => onInsertElement('two-columns')}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <Columns className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">2 Colonnes (Tableau Email)</div>
                  <div className="text-[10px] text-neutral-500">Bloc côte à côte compatible tous webmails</div>
                </div>
              </button>

              <button
                onClick={() => onInsertElement('callout')}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">Boîte de Mise en Valeur</div>
                  <div className="text-[10px] text-neutral-500">Fond doux avec bordure subtile</div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onInsertElement('divider')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 text-left transition-all"
                >
                  <Minus className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-200">Séparateur</span>
                </button>

                <button
                  onClick={() => onInsertElement('spacer')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 text-left transition-all"
                >
                  <MoveVertical className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-200">Espaceur 24px</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Layers & DOM Navigator */}
      {activeTab === 'layers' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Éléments détectés</span>
            <span className="text-[10px] font-mono text-neutral-500">{domElements.length} nœuds</span>
          </div>

          {domElements.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              Aucun élément dans le document. Importez un template ou ajoutez des blocs.
            </div>
          ) : (
            domElements.map((el, idx) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                      : 'bg-neutral-950/40 hover:bg-neutral-800/60 border-transparent text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase px-1 py-0.5 bg-neutral-900 rounded shrink-0">
                      {el.type}
                    </span>
                    <span className="truncate text-xs font-medium" title={el.text || el.tagName}>
                      {el.text ? el.text.slice(0, 24) : `<${el.tagName}>`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onMoveElement(el.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:text-white text-neutral-500 disabled:opacity-20 transition-colors"
                      title="Monter dans le document"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onMoveElement(el.id, 'down')}
                      disabled={idx === domElements.length - 1}
                      className="p-1 hover:text-white text-neutral-500 disabled:opacity-20 transition-colors"
                      title="Descendre dans le document"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onToggleLock(el.id)}
                      className="p-1 hover:text-amber-400 text-neutral-500 transition-colors"
                      title={el.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                    >
                      {el.isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onDeleteElement(el.id)}
                      className="p-1 hover:text-red-400 text-neutral-500 transition-colors"
                      title="Supprimer l'élément"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Email Client Compatibility Audit */}
      {activeTab === 'audit' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400">Score de Compatibilité</span>
              <span className={`text-lg font-bold font-mono ${auditResult.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {auditResult.score}/100 ({auditResult.grade})
              </span>
            </div>

            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${
                  auditResult.score >= 80 ? 'bg-emerald-500' : auditResult.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${auditResult.score}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono">
              <div>Poids : <span className="text-neutral-200 font-semibold">{auditResult.metrics.estimatedKb} Ko</span></div>
              <div>Tableaux : <span className="text-neutral-200 font-semibold">{auditResult.metrics.tablesCount}</span></div>
              <div>Images : <span className="text-neutral-200 font-semibold">{auditResult.metrics.imagesWithAlt}/{auditResult.metrics.totalImages} alt</span></div>
              <div>Limite Gmail : <span className={auditResult.metrics.isOverGmailClippingLimit ? 'text-red-400 font-bold' : 'text-emerald-400'}>{auditResult.metrics.isOverGmailClippingLimit ? 'Tronqué' : 'OK (&lt;102k)'}</span></div>
            </div>

            <button
              onClick={onAutoFixCompatibility}
              className="mt-3 w-full py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Optimiser & Corriger en 1 Clic</span>
            </button>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Points de Vigilance ({auditResult.issues.length})
            </div>

            {auditResult.issues.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Parfait ! Votre template respecte toutes les règles de délivrabilité et compatibilité.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {auditResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs ${
                      issue.severity === 'error'
                        ? 'bg-red-950/20 border-red-800/40 text-red-200'
                        : issue.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold mb-1">
                      {issue.severity === 'error' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{issue.title}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mb-1.5">{issue.description}</p>
                    <div className="text-[10px] text-indigo-300 bg-neutral-900/80 p-1.5 rounded">
                      <strong>Conseil :</strong> {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Email Metadata Panel */}
      {activeTab === 'meta' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            En-têtes de l'Email
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Objet de l'email</label>
            <input
              type="text"
              value={metadata.subject}
              onChange={(e) => onUpdateMetadata({ subject: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Ex: 🚀 Découvrez la nouvelle version 3.0"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Texte de pré-en-tête (Preheader)</label>
            <textarea
              rows={2}
              value={metadata.preheader}
              onChange={(e) => onUpdateMetadata({ preheader: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Texte affiché à côté de l'objet dans la boîte de réception..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Nom expéditeur</label>
              <input
                type="text"
                value={metadata.senderName}
                onChange={(e) => onUpdateMetadata({ senderName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Courrier Studio"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Email d'envoi</label>
              <input
                type="email"
                value={metadata.senderEmail}
                onChange={(e) => onUpdateMetadata({ senderEmail: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="contact@domaine.fr"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
