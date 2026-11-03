import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid, 
  Magnet, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Copy, 
  Trash2, 
  Lock, 
  Unlock,
  Move,
  CornerDownRight
} from 'lucide-react';
import { DeviceViewport, SelectedElementInfo, AlignmentGuide } from '../types/editor';

interface VisualCanvasProps {
  html: string;
  onHtmlChange: (newHtml: string) => void;
  selectedElement: SelectedElementInfo | null;
  onSelectElement: (el: SelectedElementInfo | null) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateElementStyle: (id: string, newStyles: Partial<SelectedElementInfo['styles']>) => void;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  html,
  onHtmlChange,
  selectedElement,
  onSelectElement,
  onDuplicateElement,
  onDeleteElement,
  onToggleLock,
  onUpdateElementStyle,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Gizmo overlay positioning state relative to the iframe
  const [gizmoRect, setGizmoRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; originalLeft: number; originalTop: number; originalWidth: number; originalHeight: number }>({
    x: 0,
    y: 0,
    originalLeft: 0,
    originalTop: 0,
    originalWidth: 0,
    originalHeight: 0,
  });

  // Determine viewport width
  const getViewportWidth = (): string => {
    switch (viewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '640px';
      case 'desktop':
      default:
        return '680px';
    }
  };

  // Sync iframe document content safely
  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Inject editor helper CSS for interaction inside the iframe
    const helperCss = `
      <style id="courrier-studio-helper-styles">
        [data-cs-id] {
          cursor: pointer !important;
          transition: outline 0.15s ease;
        }
        [data-cs-id]:hover {
          outline: 1.5px dashed #6366f1 !important;
          outline-offset: 2px;
        }
        [data-cs-selected="true"] {
          outline: 2px solid #4f46e5 !important;
          outline-offset: 2px;
        }
        [data-cs-locked="true"] {
          cursor: not-allowed !important;
        }
        /* Selection handles styling inside iframe */
        .cs-editable-active {
          outline: 2px solid #10b981 !important;
          background-color: rgba(16, 185, 129, 0.05) !important;
          cursor: text !important;
        }
      </style>
    `;

    // Write HTML to iframe
    iframeDoc.open();
    iframeDoc.write(html.replace('</head>', `${helperCss}</head>`));
    iframeDoc.close();

    // Attach click and selection listeners inside iframe
    attachIframeListeners(iframeDoc);
  }, [html]);

  useEffect(() => {
    updateIframeContent();
  }, [updateIframeContent]);

  // Update gizmo rect whenever selection changes or window resizes
  const updateGizmoRect = useCallback(() => {
    if (!selectedElement || !iframeRef.current) {
      setGizmoRect(null);
      return;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const el = iframeDoc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
    if (!el) {
      setGizmoRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const scale = zoom / 100;

    setGizmoRect({
      top: iframeRect.top + rect.top * scale,
      left: iframeRect.left + rect.left * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    });
  }, [selectedElement, zoom]);

  useEffect(() => {
    updateGizmoRect();
    const handleScroll = () => updateGizmoRect();
    const handleResize = () => updateGizmoRect();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (iframe?.contentWindow) {
        iframe.contentWindow.removeEventListener('scroll', handleScroll);
      }
    };
  }, [updateGizmoRect]);

  const attachIframeListeners = (iframeDoc: Document) => {
    // Click selection listener
    iframeDoc.body.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-cs-id]') as HTMLElement;
      if (target) {
        e.preventDefault();
        e.stopPropagation();

        // Mark visually selected inside iframe
        iframeDoc.querySelectorAll('[data-cs-selected]').forEach((el) => el.removeAttribute('data-cs-selected'));
        target.setAttribute('data-cs-selected', 'true');

        const computed = window.getComputedStyle(target);
        const rect = target.getBoundingClientRect();

        const info: SelectedElementInfo = {
          id: target.getAttribute('data-cs-id') || '',
          tagName: target.tagName.toLowerCase(),
          type: (target.getAttribute('data-cs-type') as any) || (target.tagName.toLowerCase() === 'img' ? 'image' : 'text'),
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          styles: {
            color: target.style.color || computed.color,
            backgroundColor: target.style.backgroundColor || computed.backgroundColor,
            fontSize: target.style.fontSize || computed.fontSize,
            fontWeight: target.style.fontWeight || computed.fontWeight,
            fontFamily: target.style.fontFamily || computed.fontFamily,
            textAlign: target.style.textAlign || computed.textAlign,
            lineHeight: target.style.lineHeight || computed.lineHeight,
            letterSpacing: target.style.letterSpacing || computed.letterSpacing,
            paddingTop: target.style.paddingTop || computed.paddingTop,
            paddingRight: target.style.paddingRight || computed.paddingRight,
            paddingBottom: target.style.paddingBottom || computed.paddingBottom,
            paddingLeft: target.style.paddingLeft || computed.paddingLeft,
            marginTop: target.style.marginTop || computed.marginTop,
            marginRight: target.style.marginRight || computed.marginRight,
            marginBottom: target.style.marginBottom || computed.marginBottom,
            marginLeft: target.style.marginLeft || computed.marginLeft,
            width: target.style.width || `${Math.round(rect.width)}px`,
            height: target.style.height || `${Math.round(rect.height)}px`,
            borderRadius: target.style.borderRadius || computed.borderRadius,
            borderWidth: target.style.borderWidth || computed.borderWidth,
            borderColor: target.style.borderColor || computed.borderColor,
            borderStyle: target.style.borderStyle || computed.borderStyle,
            display: target.style.display || computed.display,
            position: target.style.position || computed.position,
            transform: target.style.transform || computed.transform,
          },
          attributes: {
            href: target.getAttribute('href') || undefined,
            src: target.getAttribute('src') || undefined,
            alt: target.getAttribute('alt') || undefined,
            title: target.getAttribute('title') || undefined,
            width: target.getAttribute('width') || undefined,
            height: target.getAttribute('height') || undefined,
          },
          text: target.textContent || '',
          isLocked: target.getAttribute('data-cs-locked') === 'true',
        };

        onSelectElement(info);
      } else {
        // Clicked outside any element
        iframeDoc.querySelectorAll('[data-cs-selected]').forEach((el) => el.removeAttribute('data-cs-selected'));
        onSelectElement(null);
      }
    });

    // Double-click for inline text editing directly in canvas!
    iframeDoc.body.addEventListener('dblclick', (e) => {
      const target = (e.target as HTMLElement).closest('[data-cs-id]') as HTMLElement;
      if (target && target.tagName.toLowerCase() !== 'img') {
        target.contentEditable = 'true';
        target.classList.add('cs-editable-active');
        target.focus();

        const onBlur = () => {
          target.contentEditable = 'false';
          target.classList.remove('cs-editable-active');
          target.removeEventListener('blur', onBlur);

          // Serialize changes back to HTML!
          const newHtml = iframeDoc.documentElement.outerHTML.replace(/<style id="courrier-studio-helper-styles">[\s\S]*?<\/style>/, '');
          onHtmlChange(newHtml);
        };

        target.addEventListener('blur', onBlur);
      }
    });
  };

  // Drag-and-drop movement handler
  const handleDragStart = (e: React.MouseEvent) => {
    if (!selectedElement || selectedElement.isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      originalLeft: parseInt(selectedElement.styles.marginLeft, 10) || 0,
      originalTop: parseInt(selectedElement.styles.marginTop, 10) || 0,
      originalWidth: parseInt(selectedElement.styles.width, 10) || 0,
      originalHeight: parseInt(selectedElement.styles.height, 10) || 0,
    };
  };

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!selectedElement || selectedElement.isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(handle);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      originalLeft: 0,
      originalTop: 0,
      originalWidth: gizmoRect ? gizmoRect.width / (zoom / 100) : 100,
      originalHeight: gizmoRect ? gizmoRect.height / (zoom / 100) : 100,
    };
  };

  // Global mousemove and mouseup listeners for drag and resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElement) return;

      const scale = zoom / 100;
      const dx = (e.clientX - dragStartPos.current.x) / scale;
      const dy = (e.clientY - dragStartPos.current.y) / scale;

      if (isDragging) {
        // Free movement: calculate new margins or transform
        const newLeft = Math.round(dragStartPos.current.originalLeft + dx);
        const newTop = Math.round(dragStartPos.current.originalTop + dy);

        // Alignment guides: snap to center if near 0
        const guides: AlignmentGuide[] = [];
        let finalLeft = newLeft;
        if (snapEnabled && Math.abs(newLeft) < 15) {
          finalLeft = 0;
          guides.push({ type: 'vertical', position: window.innerWidth / 2, label: 'Centre' });
        }
        setAlignmentGuides(guides);

        // Update style directly in iframe for instant 60fps feedback
        const iframe = iframeRef.current;
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (iframeDoc) {
          const el = iframeDoc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
          if (el) {
            el.style.transform = `translate(${finalLeft}px, ${newTop}px)`;
            updateGizmoRect();
          }
        }
      } else if (isResizing) {
        let newWidth = dragStartPos.current.originalWidth;
        let newHeight = dragStartPos.current.originalHeight;

        // Aspect ratio lock for images to prevent distortion
        const isImage = selectedElement.tagName === 'img' || selectedElement.type === 'image';
        const aspectRatio = dragStartPos.current.originalWidth / (dragStartPos.current.originalHeight || 1);

        if (isResizing.includes('e')) newWidth += dx;
        if (isResizing.includes('w')) newWidth -= dx;
        if (isResizing.includes('s')) newHeight += dy;
        if (isResizing.includes('n')) newHeight -= dy;

        newWidth = Math.max(30, Math.min(600, Math.round(newWidth)));

        if (isImage) {
          newHeight = Math.round(newWidth / aspectRatio);
        } else {
          newHeight = Math.max(20, Math.round(newHeight));
        }

        const iframe = iframeRef.current;
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (iframeDoc) {
          const el = iframeDoc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
          if (el) {
            el.style.width = `${newWidth}px`;
            el.setAttribute('width', `${newWidth}`);
            if (isImage) {
              el.style.height = `${newHeight}px`;
              el.setAttribute('height', `${newHeight}`);
            }
            updateGizmoRect();
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
        setAlignmentGuides([]);

        // Commit changes to HTML state
        const iframe = iframeRef.current;
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (iframeDoc) {
          const helperStyle = iframeDoc.getElementById('courrier-studio-helper-styles');
          if (helperStyle) helperStyle.remove();
          const cleanHtml = iframeDoc.documentElement.outerHTML;
          onHtmlChange(cleanHtml);
        }
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElement, zoom, snapEnabled, onHtmlChange, updateGizmoRect]);

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 relative overflow-hidden select-none" ref={containerRef}>
      {/* Canvas Floating Top Toolbar */}
      <div className="h-10 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-300 z-10">
        {/* Left: Responsive Device Viewports */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewport === 'desktop' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Aperçu Ordinateur (680px standard)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Desktop (680px)</span>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewport === 'tablet' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Aperçu Tablette (640px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Tablette (640px)</span>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewport === 'mobile' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Aperçu Téléphone (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Mobile (375px)</span>
          </button>
        </div>

        {/* Center: Guidelines & Grid toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showGrid ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Afficher / Masquer la grille repère"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Grille</span>
          </button>

          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              snapEnabled ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Magnétisme d'alignement intelligent"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="text-[11px]">Magnétisme</span>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="Dézoomer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-mono text-[11px] text-neutral-300">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="Zoomer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors ml-1"
            title="Réinitialiser zoom (100%)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Area */}
      <div 
        className={`flex-1 overflow-auto p-8 flex items-start justify-center relative ${
          showGrid ? 'bg-[linear-gradient(to_right,#1f293718_1px,transparent_1px),linear-gradient(to_bottom,#1f293718_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-neutral-950'
        }`}
      >
        {/* Iframe Email Wrapper */}
        <div
          className="transition-all duration-200 shadow-2xl rounded-lg overflow-hidden border border-neutral-800 bg-white"
          style={{
            width: getViewportWidth(),
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            minHeight: '800px',
          }}
        >
          <iframe
            ref={iframeRef}
            title="Courrier Studio Email Canvas"
            className="w-full h-full min-h-[850px] border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        {/* Smart Alignment Guides */}
        {alignmentGuides.map((guide, idx) => (
          <div
            key={idx}
            className="absolute pointer-events-none z-30 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            style={
              guide.type === 'vertical'
                ? {
                    top: 0,
                    bottom: 0,
                    left: `${guide.position}px`,
                    width: '1px',
                  }
                : {
                    left: 0,
                    right: 0,
                    top: `${guide.position}px`,
                    height: '1px',
                  }
            }
          >
            {guide.label && (
              <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {guide.label}
              </span>
            )}
          </div>
        ))}

        {/* Canva-style Selection Gizmo Overlay */}
        {gizmoRect && selectedElement && (
          <div
            className="fixed pointer-events-none z-40 transition-none"
            style={{
              top: `${gizmoRect.top}px`,
              left: `${gizmoRect.left}px`,
              width: `${gizmoRect.width}px`,
              height: `${gizmoRect.height}px`,
            }}
          >
            {/* Outline Box */}
            <div className={`w-full h-full border-2 border-indigo-500 rounded-sm pointer-events-auto relative ${
              selectedElement.isLocked ? 'border-amber-500' : ''
            }`}>
              {/* Floating Quick Action Mini-Toolbar */}
              <div 
                className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded-lg p-1 shadow-xl text-neutral-200 z-50 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Drag handle */}
                <button
                  onMouseDown={handleDragStart}
                  className="p-1 hover:text-white hover:bg-neutral-800 rounded cursor-grab active:cursor-grabbing text-neutral-400"
                  title="Déplacer librement l'élément avec la souris"
                >
                  <Move className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />

                {/* Tag and dimension indicator */}
                <span className="text-[10px] font-mono font-medium px-1 text-neutral-300">
                  {selectedElement.tagName} &bull; {Math.round(gizmoRect.width)}&times;{Math.round(gizmoRect.height)}
                </span>

                <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />

                {/* Duplicate */}
                <button
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="p-1 hover:text-white hover:bg-neutral-800 rounded text-neutral-400 transition-colors"
                  title="Dupliquer l'élément (Ctrl+D)"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {/* Lock / Unlock */}
                <button
                  onClick={() => onToggleLock(selectedElement.id)}
                  className="p-1 hover:text-amber-400 hover:bg-neutral-800 rounded text-neutral-400 transition-colors"
                  title={selectedElement.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                >
                  {selectedElement.isLocked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="p-1 hover:text-red-400 hover:bg-neutral-800 rounded text-neutral-400 transition-colors"
                  title="Supprimer l'élément (Suppr)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* 8 Bounding Box Resize Handles (only if not locked) */}
              {!selectedElement.isLocked && (
                <>
                  {/* NW */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* N */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* NE */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* E */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* SE */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* S */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* SW */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* W */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w')}
                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint Banner */}
      <div className="h-7 bg-neutral-900 border-t border-neutral-800 px-4 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-3 h-3 text-indigo-400" />
            <span>Double-cliquez pour éditer le texte directement</span>
          </span>
          <span>&bull;</span>
          <span>Glissez la poignée pour déplacer</span>
          <span>&bull;</span>
          <span>Poignées d'angles pour redimensionner</span>
        </div>
        <div className="font-mono text-neutral-500">
          Format Email Standard 600px
        </div>
      </div>
    </div>
  );
};
