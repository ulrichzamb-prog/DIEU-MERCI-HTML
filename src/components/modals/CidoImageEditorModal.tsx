import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  Download, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Paintbrush, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Move, 
  Crop, 
  Maximize2, 
  Type, 
  Square, 
  Palette,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export type CidoTool = 
  | 'spot_healing'      // Outil Correcteur localisé
  | 'healing'           // Outil Correcteur
  | 'patch'             // Outil Pièce
  | 'content_aware'     // Outil Déplacement basé sur le contenu
  | 'red_eye'           // Outil Œil rouge
  | 'clone_stamp'       // Outil Tampon de duplication
  | 'pattern_stamp'     // Outil Tampon de motif
  | 'brush'             // Outil Pinceau
  | 'pencil'            // Outil Crayon
  | 'mixer_brush'       // Outil Pinceau mélangeur
  | 'eraser'            // Outil Gomme
  | 'gradient'          // Outil Dégradé
  | 'paint_bucket'      // Outil Pot de peinture
  | 'blur'              // Outil Goutte d'eau (Flou)
  | 'sharpen'           // Outil Netteté
  | 'smudge'            // Outil Doigt
  | 'dodge'             // Outil Densité -
  | 'burn'              // Outil Densité +
  | 'sponge'            // Outil Éponge
  | 'crop'              // Outil Recadrage
  | 'perspective_crop'; // Outil Perspective de recadrage

export interface CidoToolMeta {
  id: CidoTool;
  name: string;
  category: 'correction' | 'dessin' | 'retouche' | 'geometrie';
  icon: string;
  desc: string;
}

export const CIDO_TOOLS: CidoToolMeta[] = [
  // Correction
  { id: 'spot_healing', name: 'Outil Correcteur localisé', category: 'correction', icon: '🩹', desc: 'Supprime instantanément les taches et imperfections' },
  { id: 'healing', name: 'Outil Correcteur', category: 'correction', icon: '🩺', desc: 'Répare les textures en fusionnant avec la zone cible' },
  { id: 'patch', name: 'Outil Pièce', category: 'correction', icon: '🧩', desc: 'Remplace une zone sélectionnée par un échantillon' },
  { id: 'content_aware', name: 'Outil Déplacement contenu', category: 'correction', icon: '↔️', desc: 'Déplace un élément avec recomposition de fond' },
  { id: 'red_eye', name: 'Outil Œil rouge', category: 'correction', icon: '👁️', desc: 'Atténue et neutralise les reflets rouges des yeux' },

  // Tampons & Dessin
  { id: 'clone_stamp', name: 'Outil Tampon de duplication', category: 'dessin', icon: '🎯', desc: 'Clone des pixels depuis une source vers une cible' },
  { id: 'pattern_stamp', name: 'Outil Tampon de motif', category: 'dessin', icon: '💠', desc: 'Applique un motif texturé géométrique' },
  { id: 'brush', name: 'Outil Pinceau', category: 'dessin', icon: '🖌️', desc: 'Tracé fluide avec couleur, lissage et opacité' },
  { id: 'pencil', name: 'Outil Crayon', category: 'dessin', icon: '✏️', desc: 'Dessin précis à bords nets au pixel près' },
  { id: 'mixer_brush', name: 'Outil Pinceau mélangeur', category: 'dessin', icon: '🎨', desc: 'Mélange les couleurs du canvas comme de la peinture à l’huile' },
  { id: 'eraser', name: 'Outil Gomme', category: 'dessin', icon: '🧼', desc: 'Efface les pixels pour révéler le fond ou la transparence' },
  { id: 'gradient', name: 'Outil Dégradé', category: 'dessin', icon: '🌈', desc: 'Applique un fondu de transition bicolore' },
  { id: 'paint_bucket', name: 'Outil Pot de peinture', category: 'dessin', icon: '🪣', desc: 'Remplit uniformément la zone ou le calque sélectionné' },

  // Retouche & Teinte
  { id: 'blur', name: 'Outil Goutte d\'eau (Flou)', category: 'retouche', icon: '💧', desc: 'Adoucit et floute localement les détails' },
  { id: 'sharpen', name: 'Outil Netteté', category: 'retouche', icon: '▲', desc: 'Renforce les contrastes et la netteté des contours' },
  { id: 'smudge', name: 'Outil Doigt', category: 'retouche', icon: '👆', desc: 'Étale et frictionne la matière picturale' },
  { id: 'dodge', name: 'Outil Densité - (Éclaircir)', category: 'retouche', icon: '☀️', desc: 'Éclaircit les tons moyens et les ombres' },
  { id: 'burn', name: 'Outil Densité + (Assombrir)', category: 'retouche', icon: '🔥', desc: 'Assombrit les zones peintes pour accentuer le relief' },
  { id: 'sponge', name: 'Outil Éponge', category: 'retouche', icon: '🧽', desc: 'Sature ou désature les couleurs localement' },

  // Géométrie & Recadrage
  { id: 'crop', name: 'Outil Recadrage', category: 'geometrie', icon: '📐', desc: 'Recadre les dimensions selon un rectangle défini' },
  { id: 'perspective_crop', name: 'Outil Perspective de recadrage', category: 'geometrie', icon: '📐', desc: 'Corrige la perspective et redresse l\'image' },
];

export type LayerConcept = 
  | 'premier_plan'      // Foreground overlay
  | 'arriere_plan'      // Background
  | 'plan_intermediaire'// Midground
  | 'fond'              // Base background
  | 'forme'             // Geometric shape
  | 'texte_explicite'   // Explicit title
  | 'sous_texte';       // Subtitle / caption

export interface CidoLayer {
  id: string;
  name: string;
  concept: LayerConcept;
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  position: { x: number; y: number };
  alignment: 'gauche' | 'centre' | 'droite';
  text?: string;
  textColor?: string;
  textSize?: number;
  shapeType?: 'rectangle' | 'circle' | 'badge';
  shapeColor?: string;
}

interface CidoImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  elementId?: string;
  onApplyImageToDocument?: (elementId: string, newSrc: string) => void;
}

export const CidoImageEditorModal: React.FC<CidoImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  elementId,
  onApplyImageToDocument,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const [activeTool, setActiveTool] = useState<CidoTool>('spot_healing');
  const [activeTab, setActiveTab] = useState<'tools' | 'layers' | 'filters'>('tools');
  
  // Brush parameters
  const [brushSize, setBrushSize] = useState<number>(24);
  const [brushColor, setBrushColor] = useState<string>('#4f46e5');
  const [brushOpacity, setBrushOpacity] = useState<number>(100);

  // Filters (Implicite / Explicite)
  const [filterBrightness, setFilterBrightness] = useState<number>(100);
  const [filterContrast, setFilterContrast] = useState<number>(100);
  const [filterSaturation, setFilterSaturation] = useState<number>(100);
  const [filterTemperature, setFilterTemperature] = useState<number>(0);
  const [filterBlur, setFilterBlur] = useState<number>(0);
  const [filterSepia, setFilterSepia] = useState<number>(0);
  const [filterGrayscale, setFilterGrayscale] = useState<number>(0);
  const [filterInvert, setFilterInvert] = useState<number>(0);
  const [filterVignette, setFilterVignette] = useState<number>(0);

  // Layers stack
  const [layers, setLayers] = useState<CidoLayer[]>([
    {
      id: 'layer-bg',
      name: 'Image Source (Fond)',
      concept: 'fond',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      position: { x: 0, y: 0 },
      alignment: 'centre',
    },
    {
      id: 'layer-badge',
      name: 'Badge Forme',
      concept: 'forme',
      visible: false,
      opacity: 90,
      blendMode: 'normal',
      position: { x: 20, y: 20 },
      alignment: 'gauche',
      shapeType: 'badge',
      shapeColor: '#4f46e5',
    },
    {
      id: 'layer-title',
      name: 'Titre Explicite',
      concept: 'texte_explicite',
      visible: false,
      opacity: 100,
      blendMode: 'normal',
      position: { x: 20, y: 60 },
      alignment: 'gauche',
      text: 'Offre Spéciale Email',
      textColor: '#ffffff',
      textSize: 22,
    },
    {
      id: 'layer-sub',
      name: 'Sous-texte Explicatif',
      concept: 'sous_texte',
      visible: false,
      opacity: 90,
      blendMode: 'normal',
      position: { x: 20, y: 95 },
      alignment: 'gauche',
      text: 'Valable jusqu\'au 31 du mois',
      textColor: '#e0e7ff',
      textSize: 14,
    },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('layer-bg');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const cloneSourceRef = useRef<{ x: number; y: number } | null>(null);
  const [cloneSourceSet, setCloneSourceSet] = useState<boolean>(false);

  // Canvas zoom
  const [zoom, setZoom] = useState<number>(100);

  // Load image on mount
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 400;
        renderCanvas();
      }
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Main rendering engine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = baseImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply CSS filters for implicit and explicit adjustments
    const filterParts = [
      `brightness(${filterBrightness}%)`,
      `contrast(${filterContrast}%)`,
      `saturate(${filterSaturation}%)`,
      filterBlur > 0 ? `blur(${filterBlur}px)` : '',
      filterSepia > 0 ? `sepia(${filterSepia}%)` : '',
      filterGrayscale > 0 ? `grayscale(${filterGrayscale}%)` : '',
      filterInvert > 0 ? `invert(${filterInvert}%)` : '',
    ].filter(Boolean).join(' ');

    ctx.filter = filterParts || 'none';

    // 1. Draw base background layer
    const bgLayer = layers.find((l) => l.concept === 'fond' || l.id === 'layer-bg');
    if (bgLayer && bgLayer.visible) {
      ctx.globalAlpha = bgLayer.opacity / 100;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Reset filter for subsequent layered overlays
    ctx.filter = 'none';

    // 2. Render higher layers (shapes, text overlays, badges)
    layers.forEach((layer) => {
      if (!layer.visible || layer.concept === 'fond' || layer.id === 'layer-bg') return;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;

      // Shapes
      if (layer.concept === 'forme' && layer.shapeColor) {
        ctx.fillStyle = layer.shapeColor;
        if (layer.shapeType === 'badge') {
          // Rounded badge
          const x = layer.position.x;
          const y = layer.position.y;
          const w = 240;
          const h = 42;
          const r = 8;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();
        } else if (layer.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(layer.position.x + 50, layer.position.y + 50, 50, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Explicit Headline Text
      if (layer.concept === 'texte_explicite' && layer.text) {
        ctx.fillStyle = layer.textColor || '#ffffff';
        ctx.font = `bold ${layer.textSize || 22}px Arial, sans-serif`;
        ctx.textAlign = layer.alignment === 'centre' ? 'center' : layer.alignment === 'droite' ? 'right' : 'left';
        ctx.fillText(layer.text, layer.position.x, layer.position.y);
      }

      // Subtitle
      if (layer.concept === 'sous_texte' && layer.text) {
        ctx.fillStyle = layer.textColor || '#e0e7ff';
        ctx.font = `${layer.textSize || 14}px Arial, sans-serif`;
        ctx.textAlign = layer.alignment === 'centre' ? 'center' : layer.alignment === 'droite' ? 'right' : 'left';
        ctx.fillText(layer.text, layer.position.x, layer.position.y);
      }

      ctx.restore();
    });

    // 3. Vignette overlay if active
    if (filterVignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.7
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${filterVignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [
    layers, 
    filterBrightness, 
    filterContrast, 
    filterSaturation, 
    filterBlur, 
    filterSepia, 
    filterGrayscale, 
    filterInvert, 
    filterVignette
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Tool Action Handler for interactive painting / healing / cloning
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (e.altKey && activeTool === 'clone_stamp') {
      // Set clone source point
      cloneSourceRef.current = { x, y };
      setCloneSourceSet(true);
      return;
    }

    setIsDrawing(true);
    applyToolEffect(x, y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    applyToolEffect(x, y);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const applyToolEffect = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Spot Healing & Healing Brush
    if (activeTool === 'spot_healing' || activeTool === 'healing') {
      // Sample neighboring region and blend over center
      const r = brushSize / 2;
      const sample = ctx.getImageData(Math.max(0, x - r - 4), Math.max(0, y - r - 4), r * 2 + 8, r * 2 + 8);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.filter = 'blur(3px)';
      ctx.fill();
    } 
    // Brush / Pencil / Mixer Brush
    else if (activeTool === 'brush' || activeTool === 'mixer_brush') {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = brushColor;
      ctx.globalAlpha = brushOpacity / 100;
      ctx.fill();
    } else if (activeTool === 'pencil') {
      ctx.fillStyle = brushColor;
      ctx.globalAlpha = 1;
      ctx.fillRect(x - brushSize / 4, y - brushSize / 4, brushSize / 2, brushSize / 2);
    } 
    // Eraser
    else if (activeTool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
    // Red Eye Removal
    else if (activeTool === 'red_eye') {
      const r = Math.max(10, brushSize / 2);
      const imgData = ctx.getImageData(x - r, y - r, r * 2, r * 2);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const red = d[i];
        const green = d[i + 1];
        const blue = d[i + 2];
        if (red > 100 && red > (green + blue) * 0.8) {
          // Desaturate overly red pupil
          const avg = (green + blue) / 2;
          d[i] = avg * 0.7;
          d[i + 1] = avg * 0.7;
          d[i + 2] = avg * 0.7;
        }
      }
      ctx.putImageData(imgData, x - r, y - r);
    }
    // Clone Stamp
    else if (activeTool === 'clone_stamp' && cloneSourceRef.current) {
      const r = brushSize;
      const src = cloneSourceRef.current;
      const imgData = ctx.getImageData(src.x - r / 2, src.y - r / 2, r, r);
      ctx.putImageData(imgData, x - r / 2, y - r / 2);
    }
    // Blur & Sharpen
    else if (activeTool === 'blur') {
      ctx.filter = 'blur(4px)';
      ctx.drawImage(canvas, x - brushSize, y - brushSize, brushSize * 2, brushSize * 2, x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    }
    // Dodge (Éclaircir) & Burn (Assombrir)
    else if (activeTool === 'dodge') {
      ctx.globalCompositeOperation = 'color-dodge';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTool === 'burn') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Move layer order (Dessus / Dessous)
  const moveLayer = (id: string, direction: 'up' | 'down') => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx < prev.length - 1) {
        const next = [...prev];
        const temp = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = temp;
        return next;
      }
      if (direction === 'down' && idx > 0) {
        const next = [...prev];
        const temp = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = temp;
        return next;
      }
      return prev;
    });
  };

  // Alignment update (Gauche / Centre / Droite)
  const setLayerAlignment = (id: string, align: 'gauche' | 'centre' | 'droite') => {
    const canvas = canvasRef.current;
    const w = canvas?.width || 600;
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        let x = 20;
        if (align === 'centre') x = w / 2;
        if (align === 'droite') x = w - 40;
        return { ...l, alignment: align, position: { ...l.position, x } };
      })
    );
  };

  // Apply to Document handler
  const handleApplyToDocument = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.95);

    if (elementId && onApplyImageToDocument) {
      onApplyImageToDocument(elementId, dataUrl);
    }
    onClose();
  };

  // Download modified image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `image-cido-retouche-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-6xl h-[92vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-14 px-6 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 text-sm">
              🎨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Studio Visuel CIDO &bull; Retouche Professionnelle
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                  21 Outils Spécialisés &bull; Calques Multi-Plans
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Correcteurs, Tampons, Calques (Premier/Arrière plan, Fond, Formes) et Filtres
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              title="Télécharger l'image éditée en PNG haute résolution"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Télécharger .PNG</span>
            </button>

            <button
              onClick={handleApplyToDocument}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-[0.98]"
              title="Remplacer immédiatement cette image dans le template d'email ouvert"
            >
              <Check className="w-4 h-4" />
              <span>Appliquer au document</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-2"
              title="Fermer sans appliquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body: Tools Toolbar (Left) + Canvas View (Center) + Layers/Filters (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar: The 21 Specific Tools */}
          <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 overflow-y-auto p-2 space-y-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 pt-1">
              Boîte à Outils CIDO (21)
            </div>

            {/* Quick Filter Search or Category grouping */}
            <div className="space-y-1">
              {CIDO_TOOLS.map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs' 
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                    }`}
                    title={tool.desc}
                  >
                    <span className="text-sm shrink-0">{tool.icon}</span>
                    <div className="truncate flex-1">
                      <div className="text-xs truncate">{tool.name}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-neutral-500'}`}>
                        {tool.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Brush Controls Panel */}
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-3">
              <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Propriétés de l'Outil</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>Épaisseur / Rayon :</span>
                  <span className="font-mono text-indigo-400">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>Opacité :</span>
                  <span className="font-mono text-indigo-400">{brushOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[10px] text-neutral-400 mb-1.5">Couleur active :</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {['#ffffff', '#000000', '#4f46e5', '#dc2626', '#10b981', '#f59e0b'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className="w-5 h-5 rounded border border-neutral-700"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Central Interactive Canvas */}
          <div className="flex-1 bg-neutral-900 flex flex-col items-center justify-center p-6 relative overflow-auto select-none">
            {/* Viewport Zoom Bar */}
            <div className="absolute top-3 left-4 flex items-center gap-1 bg-neutral-950/80 px-2.5 py-1 rounded-lg border border-neutral-800 text-xs text-neutral-300 z-10 backdrop-blur-xs">
              <button onClick={() => setZoom(Math.max(40, zoom - 15))} className="p-1 hover:text-white">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(200, zoom + 15))} className="p-1 hover:text-white">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoom(100)} className="p-1 hover:text-white ml-1">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hint Banner */}
            <div className="absolute top-3 right-4 bg-neutral-950/90 border border-neutral-800 px-3 py-1 rounded-lg text-[11px] text-neutral-300 flex items-center gap-2 z-10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Outil sélectionné: <strong>{CIDO_TOOLS.find(t => t.id === activeTool)?.name}</strong></span>
              {activeTool === 'clone_stamp' && (
                <span className="text-amber-400 ml-1 font-semibold">
                  {cloneSourceSet ? '(Source définie)' : '(Alt + Clic pour échantillonner)'}
                </span>
              )}
            </div>

            {/* Canvas Container */}
            <div 
              className="border-2 border-neutral-800 rounded-lg shadow-2xl bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="cursor-crosshair block max-w-full"
              />
            </div>
          </div>

          {/* Right Panel: Layers Management & Implicit / Explicit Filters */}
          <div className="w-80 bg-neutral-950 border-l border-neutral-800 flex flex-col shrink-0 select-none">
            {/* Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-900/60 p-1 gap-1">
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'layers' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Calques ({layers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'filters' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Filtres</span>
              </button>
            </div>

            {/* Tab Content 1: Layers (Premier plan, Arrière plan, Fond, Formes, Texte) */}
            {activeTab === 'layers' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Concepts & Pile de Calques
                </div>

                <div className="space-y-2">
                  {layers.map((layer) => {
                    const isSelected = selectedLayerId === layer.id;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 border-indigo-500 shadow-md'
                            : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayers((prev) =>
                                  prev.map((l) => (l.id === layer.id ? { ...l, visible: !l.visible } : l))
                                );
                              }}
                              className="text-neutral-400 hover:text-white"
                            >
                              {layer.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-600" />}
                            </button>
                            <span className="font-semibold text-neutral-200">{layer.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Move Up / Down (Dessus / Dessous) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, 'up');
                              }}
                              className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-800"
                              title="Monter (Dessus)"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, 'down');
                              }}
                              className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-800"
                              title="Descendre (Dessous)"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Layer Specific Options if selected */}
                        {isSelected && (
                          <div className="mt-3 pt-2.5 border-t border-neutral-800 space-y-2.5 text-[11px]">
                            {/* Alignment (Gauche / Centre / Droite) */}
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400">Alignement horizontal :</span>
                              <div className="flex items-center bg-neutral-950 p-0.5 rounded border border-neutral-800">
                                <button
                                  onClick={() => setLayerAlignment(layer.id, 'gauche')}
                                  className={`p-1 rounded ${layer.alignment === 'gauche' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                                  title="Gauche"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setLayerAlignment(layer.id, 'centre')}
                                  className={`p-1 rounded ${layer.alignment === 'centre' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                                  title="Centre"
                                >
                                  <AlignCenter className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setLayerAlignment(layer.id, 'droite')}
                                  className={`p-1 rounded ${layer.alignment === 'droite' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                                  title="Droite"
                                >
                                  <AlignRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Text editing for explicit text layer */}
                            {layer.text !== undefined && (
                              <div>
                                <label className="text-neutral-400 block mb-1">Contenu texte :</label>
                                <input
                                  type="text"
                                  value={layer.text}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLayers((prev) =>
                                      prev.map((l) => (l.id === layer.id ? { ...l, text: val } : l))
                                    );
                                  }}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white text-xs"
                                />
                              </div>
                            )}

                            {/* Shape color if applicable */}
                            {layer.shapeColor !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-400">Couleur de fond forme :</span>
                                <input
                                  type="color"
                                  value={layer.shapeColor}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLayers((prev) =>
                                      prev.map((l) => (l.id === layer.id ? { ...l, shapeColor: val } : l))
                                    );
                                  }}
                                  className="w-6 h-6 rounded bg-transparent border border-neutral-700 cursor-pointer"
                                />
                              </div>
                            )}

                            {/* Opacity slider */}
                            <div>
                              <div className="flex items-center justify-between text-neutral-400 mb-1">
                                <span>Opacité calque :</span>
                                <span className="font-mono text-indigo-400">{layer.opacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={layer.opacity}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setLayers((prev) =>
                                    prev.map((l) => (l.id === layer.id ? { ...l, opacity: val } : l))
                                  );
                                }}
                                className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content 2: Implicit & Explicit Filters */}
            {activeTab === 'filters' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Filtres Implicites (Tons & Balance)
                  </div>
                  <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Luminosité</span>
                        <span className="font-mono text-indigo-400">{filterBrightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        value={filterBrightness}
                        onChange={(e) => setFilterBrightness(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Contraste</span>
                        <span className="font-mono text-indigo-400">{filterContrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        value={filterContrast}
                        onChange={(e) => setFilterContrast(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Saturation</span>
                        <span className="font-mono text-indigo-400">{filterSaturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="250"
                        value={filterSaturation}
                        onChange={(e) => setFilterSaturation(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Filtres Explicites (Effets Graphiques)
                  </div>
                  <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Flou Gaussien</span>
                        <span className="font-mono text-indigo-400">{filterBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        value={filterBlur}
                        onChange={(e) => setFilterBlur(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Noir & Blanc</span>
                        <span className="font-mono text-indigo-400">{filterGrayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filterGrayscale}
                        onChange={(e) => setFilterGrayscale(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Sépia Rétro</span>
                        <span className="font-mono text-indigo-400">{filterSepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filterSepia}
                        onChange={(e) => setFilterSepia(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                        <span>Vignetage Ombré</span>
                        <span className="font-mono text-indigo-400">{filterVignette}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={filterVignette}
                        onChange={(e) => setFilterVignette(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFilterBrightness(100);
                    setFilterContrast(100);
                    setFilterSaturation(100);
                    setFilterBlur(0);
                    setFilterSepia(0);
                    setFilterGrayscale(0);
                    setFilterInvert(0);
                    setFilterVignette(0);
                  }}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-lg border border-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
