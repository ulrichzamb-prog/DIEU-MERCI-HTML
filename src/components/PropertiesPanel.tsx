import React from 'react';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  Sliders, 
  RotateCw,
  ExternalLink,
  Upload
} from 'lucide-react';
import { SelectedElementInfo } from '../types/editor';

interface PropertiesPanelProps {
  selectedElement: SelectedElementInfo | null;
  onUpdateStyle: (styles: Partial<SelectedElementInfo['styles']>) => void;
  onUpdateAttribute: (attributes: Partial<SelectedElementInfo['attributes']>) => void;
  onUpdateText: (text: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  isAspectRatioLocked?: boolean;
  onToggleAspectRatio?: () => void;
}

const EMAIL_SAFE_FONTS = [
  { name: 'Arial, sans-serif', label: 'Arial (Sans-serif)' },
  { name: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { name: 'Georgia, serif', label: 'Georgia (Sérif)' },
  { name: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { name: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS' },
  { name: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { name: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { name: "'Courier New', Courier, monospace", label: 'Courier New (Mono)' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateStyle,
  onUpdateAttribute,
  onUpdateText,
  onDuplicate,
  onDelete,
  onToggleLock,
  isAspectRatioLocked = true,
  onToggleAspectRatio,
}) => {
  if (!selectedElement) {
    return (
      <aside className="w-80 bg-neutral-900 border-l border-neutral-800 p-5 flex flex-col items-center justify-center text-center select-none text-neutral-400 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-neutral-800/80 flex items-center justify-center text-neutral-500 mb-3">
          <Sliders className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200 mb-1">Aucun élément sélectionné</h3>
        <p className="text-xs text-neutral-400 max-w-[220px] leading-relaxed">
          Cliquez sur un texte, un bouton, un tableau ou une image dans le canevas pour en modifier les propriétés.
        </p>
      </aside>
    );
  }

  const { type, tagName, styles, attributes, text, isLocked } = selectedElement;
  const isImage = tagName === 'img' || type === 'image';
  const isButton = type === 'button' || tagName === 'a';
  const isText = type === 'text' || type === 'heading' || ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'li'].includes(tagName);

  // File upload for replacing image
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateAttribute({ src: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden">
      {/* Header with Type & Quick Actions */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded font-semibold">
            {type}
          </span>
          <span className="text-xs font-mono text-neutral-400">&lt;{tagName}&gt;</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded transition-colors ${
              isLocked ? 'text-amber-400 bg-amber-950/50' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Properties Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TEXT CONTENT / LABEL */}
        {!isImage && (
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Contenu du texte
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => onUpdateText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
              placeholder="Écrivez le texte..."
            />
          </div>
        )}

        {/* IMAGE / LOGO SPECIFICS */}
        {isImage && (
          <div className="space-y-3 p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Propriétés de l'image</span>
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            {/* Mode Redimensionnement (Proportions vs Libre) */}
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Mode de redimensionnement</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={onToggleAspectRatio}
                  className={`py-1 px-2 text-[11px] font-medium rounded transition-all text-center ${
                    isAspectRatioLocked
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🔒 Proportions
                </button>
                <button
                  type="button"
                  onClick={onToggleAspectRatio}
                  className={`py-1 px-2 text-[11px] font-medium rounded transition-all text-center ${
                    !isAspectRatioLocked
                      ? 'bg-amber-950 text-amber-300 border border-amber-700/60 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🔓 Libre
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                {isAspectRatioLocked
                  ? '✓ Ratio d\'origine préservé (recommandé pour logos et signatures)'
                  : '⚠ Attention : le redimensionnement libre peut déformer l\'image'}
              </p>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Remplacer l'image</label>
              <label className="flex items-center justify-center gap-2 p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 rounded-md text-xs font-medium text-neutral-200 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Téléverser un nouveau fichier</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">URL de l'image</label>
              <input
                type="text"
                value={attributes.src || ''}
                onChange={(e) => onUpdateAttribute({ src: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://.../mon-image.png"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Texte alternatif (Alt tag)</label>
              <input
                type="text"
                value={attributes.alt || ''}
                onChange={(e) => onUpdateAttribute({ alt: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="Description pour les filtres anti-spam et malvoyants"
              />
            </div>
          </div>
        )}

        {/* BUTTON SPECIFICS & HYPERLINK */}
        {(isButton || attributes.href !== undefined) && (
          <div className="space-y-2 p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Lien de destination</span>
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={attributes.href || ''}
                onChange={(e) => onUpdateAttribute({ href: e.target.value })}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://votre-site.com/action"
              />
              {attributes.href && (
                <a
                  href={attributes.href}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 rounded border border-neutral-800"
                  title="Tester le lien"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* TYPOGRAPHY (for text & buttons) */}
        {!isImage && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Typographie (Compatible Email)
            </div>

            {/* Font Family Selector */}
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Police sûre email</label>
              <select
                value={styles.fontFamily}
                onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {EMAIL_SAFE_FONTS.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size & Weight & Color */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Taille de police</label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    value={parseInt(styles.fontSize, 10) || 16}
                    onChange={(e) => onUpdateStyle({ fontSize: `${e.target.value}px` })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">px</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Couleur du texte</label>
                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                  <input
                    type="color"
                    value={styles.color.startsWith('#') ? styles.color : '#ffffff'}
                    onChange={(e) => onUpdateStyle({ color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={styles.color}
                    onChange={(e) => onUpdateStyle({ color: e.target.value })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Formatting & Alignment Buttons */}
            <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg p-1">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onUpdateStyle({ fontWeight: styles.fontWeight === 'bold' || styles.fontWeight === '700' ? 'normal' : 'bold' })}
                  className={`p-1.5 rounded transition-colors ${
                    styles.fontWeight === 'bold' || styles.fontWeight === '700' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Gras"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStyle({ fontStyle: (styles as any).fontStyle === 'italic' ? 'normal' : 'italic' } as any)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
                  title="Italique"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-[1px] h-4 bg-neutral-800" />

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onUpdateStyle({ textAlign: 'left' })}
                  className={`p-1.5 rounded transition-colors ${styles.textAlign === 'left' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Aligner à gauche"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStyle({ textAlign: 'center' })}
                  className={`p-1.5 rounded transition-colors ${styles.textAlign === 'center' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Centrer"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStyle({ textAlign: 'right' })}
                  className={`p-1.5 rounded transition-colors ${styles.textAlign === 'right' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Aligner à droite"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStyle({ textAlign: 'justify' })}
                  className={`p-1.5 rounded transition-colors ${styles.textAlign === 'justify' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Justifier"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIMENSIONS & SPACING */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Dimensions & Marges
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Largeur</label>
              <input
                type="text"
                value={styles.width}
                onChange={(e) => onUpdateStyle({ width: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="Ex: 100% ou 320px"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Hauteur</label>
              <input
                type="text"
                value={styles.height}
                onChange={(e) => onUpdateStyle({ height: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="auto"
              />
            </div>
          </div>

          {/* Padding / Marges internes */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1">Espacement interne (Padding)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={parseInt(styles.paddingTop, 10) || 0}
                onChange={(e) => onUpdateStyle({ paddingTop: `${e.target.value}px`, paddingBottom: `${e.target.value}px` })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                placeholder="Vertical"
              />
              <input
                type="number"
                value={parseInt(styles.paddingLeft, 10) || 0}
                onChange={(e) => onUpdateStyle({ paddingLeft: `${e.target.value}px`, paddingRight: `${e.target.value}px` })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                placeholder="Horizontal"
              />
            </div>
          </div>
        </div>

        {/* COLORS & BORDERS */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Arrière-plan & Bordures
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1">Couleur d'arrière-plan</label>
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
              <input
                type="color"
                value={styles.backgroundColor.startsWith('#') ? styles.backgroundColor : '#ffffff'}
                onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={styles.backgroundColor}
                onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
                className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                placeholder="transparent ou #hex"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Rayon arrondi</label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={parseInt(styles.borderRadius, 10) || 0}
                  onChange={(e) => onUpdateStyle({ borderRadius: `${e.target.value}px` })}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 font-mono">px</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">Épaisseur bordure</label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={parseInt(styles.borderWidth, 10) || 0}
                  onChange={(e) => onUpdateStyle({ borderWidth: `${e.target.value}px`, borderStyle: 'solid' })}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 font-mono">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
