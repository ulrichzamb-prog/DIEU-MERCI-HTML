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
  CornerDownRight,
  X,
  Plus,
  Edit3,
  Check,
  Sparkles,
  Image as ImageIcon,
  MousePointerClick,
  Heading1,
  AlignLeft,
  Minus,
  Download
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
  isAspectRatioLocked?: boolean;
  onToggleAspectRatio?: () => void;
  onGroupElements?: (ids: string[]) => void;
  onInsertElementAtPosition?: (elementType: string, targetId: string, position: 'before' | 'after') => void;
  onResetDocument?: () => void;
  onOpenCidoEditor?: (elementId: string, imageSrc: string) => void;
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
  isAspectRatioLocked = true,
  onToggleAspectRatio,
  onGroupElements,
  onInsertElementAtPosition,
  onResetDocument,
  onOpenCidoEditor,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(isAspectRatioLocked);

  // Multi-selection state
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([]);

  // Gizmo overlay positioning state relative to the iframe
  const [gizmoRect, setGizmoRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [showInsertMenu, setShowInsertMenu] = useState<boolean>(false);
  const [insertPosition, setInsertPosition] = useState<'before' | 'after'>('after');
  const [caretPopover, setCaretPopover] = useState<{
    screenX: number;
    screenY: number;
    targetId: string;
  } | null>(null);
  const [caretInsertPosition, setCaretInsertPosition] = useState<'before' | 'after'>('after');
  const dragStartPos = useRef<{ x: number; y: number; originalLeft: number; originalTop: number; originalWidth: number; originalHeight: number }>({
    x: 0,
    y: 0,
    originalLeft: 0,
    originalTop: 0,
    originalWidth: 0,
    originalHeight: 0,
  });

  // Reference targets for smart alignment guides during drag and resize
  const snapTargetsRef = useRef<{
    containerCenterX: number;
    containerLeft: number;
    containerRight: number;
    candidates: Array<{
      id: string;
      screenLeft: number;
      screenTop: number;
      screenWidth: number;
      screenHeight: number;
      screenRight: number;
      screenBottom: number;
      screenCenterX: number;
      screenCenterY: number;
      rawWidth: number;
      rawHeight: number;
    }>;
    initialScreenLeft: number;
    initialScreenTop: number;
    initialScreenWidth: number;
    initialScreenHeight: number;
  }>({
    containerCenterX: 0,
    containerLeft: 0,
    containerRight: 0,
    candidates: [],
    initialScreenLeft: 0,
    initialScreenTop: 0,
    initialScreenWidth: 0,
    initialScreenHeight: 0,
  });

  // Activate inline text editing on chosen element
  const activateInlineEdit = useCallback((id: string) => {
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDoc) return;

    const target = iframeDoc.querySelector(`[data-cs-id="${id}"]`) as HTMLElement;
    if (target && target.tagName.toLowerCase() !== 'img') {
      setIsInlineEditing(true);
      target.contentEditable = 'true';
      target.classList.add('cs-editable-active');
      target.focus();

      const onBlur = () => {
        target.contentEditable = 'false';
        target.classList.remove('cs-editable-active');
        setIsInlineEditing(false);
        target.removeEventListener('blur', onBlur);

        const helperStyle = iframeDoc.getElementById('courrier-studio-helper-styles');
        if (helperStyle) helperStyle.remove();
        const cleanHtml = iframeDoc.documentElement.outerHTML;
        onHtmlChange(cleanHtml);
      };

      target.addEventListener('blur', onBlur);
      target.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          target.blur();
        }
      });
    }
  }, [onHtmlChange]);

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
      let target = (e.target as HTMLElement).closest('[data-cs-id]') as HTMLElement;
      if (!target && e.target && e.target !== iframeDoc.body && e.target !== iframeDoc.documentElement) {
        const rawEl = e.target as HTMLElement;
        rawEl.setAttribute('data-cs-id', `cs-el-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`);
        target = rawEl;
      }

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

    // Double-click anywhere on the document:
    // 1. If clicking an image -> open CIDO Image Studio
    // 2. Anywhere else -> show blinking caret and insertion popover
    iframeDoc.body.addEventListener('dblclick', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-cs-id]') as HTMLElement;

      // 1. Double clicking an image: open CIDO Studio directly!
      if (target && (target.tagName.toLowerCase() === 'img' || target.getAttribute('data-cs-type') === 'image')) {
        const id = target.getAttribute('data-cs-id') || '';
        const src = target.getAttribute('src') || '';
        if (onOpenCidoEditor) {
          onOpenCidoEditor(id, src);
          return;
        }
      }

      // 2. If clicking on a text element, enable inline editing if desired
      if (target && target.tagName.toLowerCase() !== 'img') {
        const id = target.getAttribute('data-cs-id');
        if (id) activateInlineEdit(id);
      }

      // 3. Compute screen coordinates for the blinking caret and insertion popover
      const iframeRect = iframeRef.current?.getBoundingClientRect();
      if (iframeRect) {
        const scale = zoom / 100;
        const screenX = iframeRect.left + (e.clientX * scale);
        const screenY = iframeRect.top + (e.clientY * scale);
        const targetId = target?.getAttribute('data-cs-id') || selectedElement?.id || '';
        setCaretPopover({ screenX, screenY, targetId });
      }
    });

    // Drag-over and drop support for dragging elements from sidebar
    iframeDoc.body.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    iframeDoc.body.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const elementType = e.dataTransfer?.getData('application/courrier-element');
      if (!elementType) return;

      const target = (e.target as HTMLElement).closest('[data-cs-id]') as HTMLElement;
      const targetId = target?.getAttribute('data-cs-id') || selectedElement?.id || '';

      if (targetId && onInsertElementAtPosition) {
        onInsertElementAtPosition(elementType, targetId, 'after');
      }
    });
  };

  // Populate snap reference targets for smart alignment guides
  const populateSnapTargets = useCallback(() => {
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    const iframeRect = iframe?.getBoundingClientRect();

    if (!iframe || !iframeDoc || !iframeRect || !selectedElement) return;

    const scale = zoom / 100;
    const el = iframeDoc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const initialScreenLeft = iframeRect.left + elRect.left * scale;
    const initialScreenTop = iframeRect.top + elRect.top * scale;
    const initialScreenWidth = elRect.width * scale;
    const initialScreenHeight = elRect.height * scale;

    // Find main email table or container
    const mainTable = iframeDoc.querySelector('table[style*="max-width"]') 
      || iframeDoc.querySelector('center > table') 
      || iframeDoc.querySelector('table[width="100%"]') 
      || iframeDoc.body;
    const tableRect = mainTable.getBoundingClientRect();
    const containerLeft = iframeRect.left + tableRect.left * scale;
    const containerWidth = tableRect.width * scale;
    const containerRight = containerLeft + containerWidth;
    const containerCenterX = containerLeft + containerWidth / 2;

    const candidates: Array<{
      id: string;
      screenLeft: number;
      screenTop: number;
      screenWidth: number;
      screenHeight: number;
      screenRight: number;
      screenBottom: number;
      screenCenterX: number;
      screenCenterY: number;
      rawWidth: number;
      rawHeight: number;
    }> = [];

    iframeDoc.querySelectorAll('[data-cs-id]').forEach((node) => {
      const htmlNode = node as HTMLElement;
      const id = htmlNode.getAttribute('data-cs-id') || '';
      if (id && id !== selectedElement.id && !el.contains(htmlNode) && !htmlNode.contains(el)) {
        const r = htmlNode.getBoundingClientRect();
        if (r.width > 15 && r.height > 10) {
          const sLeft = iframeRect.left + r.left * scale;
          const sTop = iframeRect.top + r.top * scale;
          const sWidth = r.width * scale;
          const sHeight = r.height * scale;
          candidates.push({
            id,
            screenLeft: sLeft,
            screenTop: sTop,
            screenWidth: sWidth,
            screenHeight: sHeight,
            screenRight: sLeft + sWidth,
            screenBottom: sTop + sHeight,
            screenCenterX: sLeft + sWidth / 2,
            screenCenterY: sTop + sHeight / 2,
            rawWidth: Math.round(r.width),
            rawHeight: Math.round(r.height),
          });
        }
      }
    });

    snapTargetsRef.current = {
      containerCenterX,
      containerLeft,
      containerRight,
      candidates,
      initialScreenLeft,
      initialScreenTop,
      initialScreenWidth,
      initialScreenHeight,
    };
  }, [selectedElement, zoom]);

  // Drag-and-drop movement handler
  const handleDragStart = (e: React.MouseEvent) => {
    if (!selectedElement || selectedElement.isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    populateSnapTargets();
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

    populateSnapTargets();
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
        const {
          containerCenterX,
          containerLeft,
          containerRight,
          candidates,
          initialScreenLeft,
          initialScreenTop,
          initialScreenWidth,
          initialScreenHeight,
        } = snapTargetsRef.current;

        // Current dragged screen positions
        let curScreenLeft = initialScreenLeft + dx * scale;
        let curScreenTop = initialScreenTop + dy * scale;
        let curScreenCenterX = curScreenLeft + initialScreenWidth / 2;
        let curScreenRight = curScreenLeft + initialScreenWidth;
        let curScreenCenterY = curScreenTop + initialScreenHeight / 2;
        let curScreenBottom = curScreenTop + initialScreenHeight;

        const guides: AlignmentGuide[] = [];
        const snapThreshold = 8; // Screen pixels tolerance
        let snappedDx = dx;
        let snappedDy = dy;

        // 1. Horizontal / X Alignment Checking
        let snappedX = false;

        // A. Check Email Container Center (highest priority)
        if (Math.abs(curScreenCenterX - containerCenterX) <= snapThreshold) {
          if (snapEnabled) {
            const shift = containerCenterX - curScreenCenterX;
            snappedDx += shift / scale;
            curScreenCenterX = containerCenterX;
            curScreenLeft += shift;
            curScreenRight += shift;
          }
          guides.push({
            type: 'vertical',
            position: Math.round(containerCenterX),
            label: "Centre de l'email",
          });
          snappedX = true;
        }

        // B. Check Email Container Left Margin
        if (!snappedX && Math.abs(curScreenLeft - containerLeft) <= snapThreshold) {
          if (snapEnabled) {
            const shift = containerLeft - curScreenLeft;
            snappedDx += shift / scale;
            curScreenLeft = containerLeft;
            curScreenRight += shift;
            curScreenCenterX += shift;
          }
          guides.push({
            type: 'vertical',
            position: Math.round(containerLeft),
            label: 'Bord gauche email',
          });
          snappedX = true;
        }

        // C. Check Email Container Right Margin
        if (!snappedX && Math.abs(curScreenRight - containerRight) <= snapThreshold) {
          if (snapEnabled) {
            const shift = containerRight - curScreenRight;
            snappedDx += shift / scale;
            curScreenRight = containerRight;
            curScreenLeft += shift;
            curScreenCenterX += shift;
          }
          guides.push({
            type: 'vertical',
            position: Math.round(containerRight),
            label: 'Bord droit email',
          });
          snappedX = true;
        }

        // D. Check Sibling Elements X Alignment
        if (!snappedX) {
          for (const cand of candidates) {
            if (Math.abs(curScreenCenterX - cand.screenCenterX) <= snapThreshold) {
              if (snapEnabled) {
                const shift = cand.screenCenterX - curScreenCenterX;
                snappedDx += shift / scale;
                curScreenCenterX = cand.screenCenterX;
                curScreenLeft += shift;
                curScreenRight += shift;
              }
              guides.push({
                type: 'vertical',
                position: Math.round(cand.screenCenterX),
                label: 'Aligné au centre',
              });
              snappedX = true;
              break;
            }
            if (Math.abs(curScreenLeft - cand.screenLeft) <= snapThreshold) {
              if (snapEnabled) {
                const shift = cand.screenLeft - curScreenLeft;
                snappedDx += shift / scale;
                curScreenLeft = cand.screenLeft;
                curScreenRight += shift;
                curScreenCenterX += shift;
              }
              guides.push({
                type: 'vertical',
                position: Math.round(cand.screenLeft),
                label: 'Aligné à gauche',
              });
              snappedX = true;
              break;
            }
            if (Math.abs(curScreenRight - cand.screenRight) <= snapThreshold) {
              if (snapEnabled) {
                const shift = cand.screenRight - curScreenRight;
                snappedDx += shift / scale;
                curScreenRight = cand.screenRight;
                curScreenLeft += shift;
                curScreenCenterX += shift;
              }
              guides.push({
                type: 'vertical',
                position: Math.round(cand.screenRight),
                label: 'Aligné à droite',
              });
              snappedX = true;
              break;
            }
          }
        }

        // 2. Vertical / Y Alignment Checking
        for (const cand of candidates) {
          if (Math.abs(curScreenTop - cand.screenTop) <= snapThreshold) {
            if (snapEnabled) {
              const shift = cand.screenTop - curScreenTop;
              snappedDy += shift / scale;
              curScreenTop = cand.screenTop;
            }
            guides.push({
              type: 'horizontal',
              position: Math.round(cand.screenTop),
              label: 'Aligné en haut',
            });
            break;
          }
          if (Math.abs(curScreenCenterY - cand.screenCenterY) <= snapThreshold) {
            if (snapEnabled) {
              const shift = cand.screenCenterY - curScreenCenterY;
              snappedDy += shift / scale;
              curScreenCenterY = cand.screenCenterY;
            }
            guides.push({
              type: 'horizontal',
              position: Math.round(cand.screenCenterY),
              label: 'Centre vertical',
            });
            break;
          }
          if (Math.abs(curScreenBottom - cand.screenBottom) <= snapThreshold) {
            if (snapEnabled) {
              const shift = cand.screenBottom - curScreenBottom;
              snappedDy += shift / scale;
              curScreenBottom = cand.screenBottom;
            }
            guides.push({
              type: 'horizontal',
              position: Math.round(cand.screenBottom),
              label: 'Aligné en bas',
            });
            break;
          }
        }

        setAlignmentGuides(guides);

        const newLeft = Math.round(dragStartPos.current.originalLeft + snappedDx);
        const newTop = Math.round(dragStartPos.current.originalTop + snappedDy);

        const iframe = iframeRef.current;
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (iframeDoc) {
          const el = iframeDoc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
          if (el) {
            el.style.transform = `translate(${newLeft}px, ${newTop}px)`;
            updateGizmoRect();
          }
        }
      } else if (isResizing) {
        let newWidth = dragStartPos.current.originalWidth;
        let newHeight = dragStartPos.current.originalHeight;

        const isImage = selectedElement.tagName === 'img' || selectedElement.type === 'image';
        const aspectRatio = dragStartPos.current.originalWidth / (dragStartPos.current.originalHeight || 1);

        if (isResizing.includes('e')) newWidth += dx;
        if (isResizing.includes('w')) newWidth -= dx;
        if (isResizing.includes('s')) newHeight += dy;
        if (isResizing.includes('n')) newHeight -= dy;

        newWidth = Math.max(30, Math.min(680, Math.round(newWidth)));

        const guides: AlignmentGuide[] = [];
        const {
          containerCenterX,
          containerLeft,
          containerRight,
          candidates,
          initialScreenLeft,
        } = snapTargetsRef.current;

        // Snapping and guides during width resize
        if (isResizing.includes('e') || isResizing.includes('w')) {
          // Standard full email width (600px)
          if (Math.abs(newWidth - 600) <= 8) {
            if (snapEnabled) newWidth = 600;
            guides.push({
              type: 'vertical',
              position: Math.round(containerRight),
              label: 'Largeur standard email (600px)',
            });
          }
          // Half email width (300px)
          else if (Math.abs(newWidth - 300) <= 8) {
            if (snapEnabled) newWidth = 300;
            guides.push({
              type: 'vertical',
              position: Math.round(containerCenterX),
              label: 'Demi-largeur email (300px)',
            });
          }
          // Sibling matching width
          else {
            for (const cand of candidates) {
              if (Math.abs(newWidth - cand.rawWidth) <= 6) {
                if (snapEnabled) newWidth = cand.rawWidth;
                guides.push({
                  type: 'vertical',
                  position: Math.round(cand.screenRight),
                  label: `Même largeur (${cand.rawWidth}px)`,
                });
                break;
              }
            }
          }

          // Check if resized right edge reaches container center or borders
          const curScreenRight = initialScreenLeft + newWidth * scale;
          if (Math.abs(curScreenRight - containerCenterX) <= 7 && !guides.some((g) => g.label?.includes('Demi-largeur'))) {
            guides.push({
              type: 'vertical',
              position: Math.round(containerCenterX),
              label: "Bord au centre de l'email",
            });
          } else if (Math.abs(curScreenRight - containerRight) <= 7 && !guides.some((g) => g.label?.includes('600px'))) {
            guides.push({
              type: 'vertical',
              position: Math.round(containerRight),
              label: "Bord droit de l'email",
            });
          }
        }

        // Snapping and guides during height resize
        if (isResizing.includes('s') || isResizing.includes('n')) {
          if (!isImage || !aspectRatioLocked) {
            for (const cand of candidates) {
              if (Math.abs(newHeight - cand.rawHeight) <= 6) {
                if (snapEnabled) newHeight = cand.rawHeight;
                guides.push({
                  type: 'horizontal',
                  position: Math.round(cand.screenBottom),
                  label: `Même hauteur (${cand.rawHeight}px)`,
                });
                break;
              }
            }
          }
        }

        if (isImage && aspectRatioLocked) {
          newHeight = Math.round(newWidth / aspectRatio);
        } else {
          newHeight = Math.max(20, Math.round(newHeight));
        }

        setAlignmentGuides(guides);

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
  }, [isDragging, isResizing, selectedElement, zoom, snapEnabled, aspectRatioLocked, onHtmlChange, updateGizmoRect]);

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

          {/* Red X button to clear current document and import another */}
          {onResetDocument && (
            <button
              onClick={onResetDocument}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/80 rounded-lg text-xs font-semibold shadow-xs transition-all ml-2"
              title="Supprimer ce document et en importer un autre"
            >
              <X className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
              <span>Effacer document (X)</span>
            </button>
          )}
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

        {/* Smart Alignment Guides (Figma & Canva style) */}
        {alignmentGuides.map((guide, idx) => (
          <div
            key={`${guide.type}-${guide.position}-${idx}`}
            className="fixed pointer-events-none z-50 transition-opacity duration-100"
            style={
              guide.type === 'vertical'
                ? {
                    top: '40px',
                    bottom: '28px',
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
            {/* Guide line with neon glow */}
            <div
              className={`w-full h-full ${
                guide.type === 'vertical'
                  ? 'border-l-2 border-dashed border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.95)]'
                  : 'border-t-2 border-dashed border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.95)]'
              }`}
            />
            {/* Elegant alignment badge */}
            {guide.label && (
              <div
                className={`absolute pointer-events-none px-2.5 py-0.5 bg-pink-600/95 backdrop-blur-xs text-white text-[10px] font-bold font-sans rounded-full shadow-xl border border-pink-300/50 flex items-center gap-1.5 whitespace-nowrap animate-in fade-in duration-100 ${
                  guide.type === 'vertical'
                    ? 'top-2 -translate-x-1/2'
                    : 'left-6 -translate-y-1/2'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{guide.label}</span>
              </div>
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
            {/* Outline Box - pointer-events-none to let clicks reach the document below */}
            <div className={`w-full h-full border-2 border-indigo-500 rounded-sm pointer-events-none relative ${
              selectedElement.isLocked ? 'border-amber-500' : ''
            }`}>
              {/* Floating Quick Action Mini-Toolbar */}
              <div 
                className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded-lg p-1 shadow-xl text-neutral-200 z-50 pointer-events-auto whitespace-nowrap"
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

                {/* Tag indicator */}
                <span className="text-[10px] font-mono font-medium px-1 text-neutral-300">
                  {selectedElement.tagName}
                </span>

                <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />

                {/* Direct Inline Text Edit / Validate Button */}
                {selectedElement.tagName !== 'img' && selectedElement.type !== 'image' && (
                  <>
                    {isInlineEditing ? (
                      <button
                        onClick={() => {
                          const iframe = iframeRef.current;
                          const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
                          const target = iframeDoc?.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;
                          if (target) target.blur();
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="Valider la modification du texte"
                      >
                        <Check className="w-3 h-3" />
                        <span>Valider</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => activateInlineEdit(selectedElement.id)}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="Éditer le texte directement dans l'interface"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Éditer texte</span>
                      </button>
                    )}
                    <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />
                  </>
                )}

                {/* In-canvas "+ Insérer" Menu Button */}
                {onInsertElementAtPosition && (
                  <div className="relative">
                    <button
                      onClick={() => setShowInsertMenu(!showInsertMenu)}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Insérer un élément à cet endroit précis sur le document"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" />
                      <span>+ Insérer</span>
                    </button>

                    {showInsertMenu && (
                      <div 
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-1.5 z-50 text-xs text-neutral-200 space-y-1"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-0.5">
                          Position d'insertion :
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 rounded border border-neutral-800">
                          <button
                            onClick={() => setInsertPosition('before')}
                            className={`py-0.5 rounded text-[10px] font-bold transition-colors ${
                              insertPosition === 'before' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            &uarr; Avant
                          </button>
                          <button
                            onClick={() => setInsertPosition('after')}
                            className={`py-0.5 rounded text-[10px] font-bold transition-colors ${
                              insertPosition === 'after' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            &darr; Après
                          </button>
                        </div>
                        <div className="h-[1px] bg-neutral-800 my-1" />
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('logo', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Logo de marque</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('image', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Image / Bannière</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('button', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <MousePointerClick className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Bouton d'Action</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('heading-1', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <Heading1 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Grand Titre H1</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('paragraph', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <AlignLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>Paragraphe</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('divider', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                        >
                          <Minus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span>Séparateur</span>
                        </button>
                        <button
                          onClick={() => {
                            onInsertElementAtPosition('download-pdf', selectedElement.id, insertPosition);
                            setShowInsertMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 rounded text-left transition-colors text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="font-bold text-red-200">Bouton Télécharger PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />

                {/* CIDO Image Editor Quick Action */}
                {(selectedElement.tagName === 'img' || selectedElement.type === 'image') && onOpenCidoEditor && (
                  <>
                    <button
                      onClick={() => onOpenCidoEditor(selectedElement.id, selectedElement.attributes.src || '')}
                      className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all"
                      title="Ouvrir le Studio Visuel CIDO (21 outils de retouche & calques)"
                    >
                      <span>🎨 CIDO Retouche</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />
                  </>
                )}

                {/* Image Aspect Ratio Mode Indicator & Toggle */}
                {(selectedElement.tagName === 'img' || selectedElement.type === 'image') && (
                  <>
                    <button
                      onClick={() => {
                        const next = !aspectRatioLocked;
                        setAspectRatioLocked(next);
                        onToggleAspectRatio?.();
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                        aspectRatioLocked
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                      title={
                        aspectRatioLocked
                          ? 'Mode : Proportions conservées (cliquez pour passer en redimensionnement libre)'
                          : 'Mode : Redimensionnement libre (cliquez pour verrouiller le ratio)'
                      }
                    >
                      {aspectRatioLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      <span>{aspectRatioLocked ? 'Ratio fixé' : 'Libre'}</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-neutral-800 my-auto" />
                  </>
                )}

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

              {/* 8 Bounding Box Resize Handles (pointer-events-auto) */}
              {!selectedElement.isLocked && (
                <>
                  {/* NW */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    className="absolute pointer-events-auto -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* N */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n')}
                    className="absolute pointer-events-auto -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* NE */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    className="absolute pointer-events-auto -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* E */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                    className="absolute pointer-events-auto top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* SE */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                    className="absolute pointer-events-auto -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* S */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's')}
                    className="absolute pointer-events-auto -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* SW */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    className="absolute pointer-events-auto -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  {/* W */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w')}
                    className="absolute pointer-events-auto top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Canva-style Blinking Caret & Placement Popover on Double Click anywhere */}
        {caretPopover && (
          <div
            className="fixed z-50 transition-none pointer-events-auto"
            style={{
              left: `${Math.min(window.innerWidth - 320, Math.max(20, caretPopover.screenX))}px`,
              top: `${Math.min(window.innerHeight - 420, Math.max(60, caretPopover.screenY))}px`,
            }}
          >
            {/* Blinking Caret Indicator */}
            <div className="absolute -top-3 -left-1 w-1 h-7 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)] rounded-full animate-pulse pointer-events-none" />

            {/* Floating Insertion Menu Card */}
            <div className="w-72 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/90 rounded-xl shadow-2xl p-3 text-neutral-200 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Insérer à cet emplacement</span>
                </div>
                <button
                  onClick={() => setCaretPopover(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Position controls */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-[10px] font-semibold">
                <button
                  onClick={() => setCaretInsertPosition('before')}
                  className={`py-1 rounded text-center transition-colors ${caretInsertPosition === 'before' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  ▲ Avant (Dessus)
                </button>
                <button
                  onClick={() => setCaretInsertPosition('after')}
                  className={`py-1 rounded text-center transition-colors ${caretInsertPosition === 'after' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  ▼ Après (Dessous)
                </button>
              </div>

              {/* Elements list */}
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('heading-1', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <Heading1 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Grand Titre H1</span>
                </button>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('paragraph', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Paragraphe / Sous-texte</span>
                </button>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('logo', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Logo de marque (200px)</span>
                </button>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('image', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Image / Bannière (560px)</span>
                </button>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('button', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Bouton d'Action (CTA)</span>
                </button>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('download-pdf', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 rounded text-left transition-colors text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="font-bold text-red-200">Bouton « Télécharger le PDF »</span>
                </button>

                <div className="pt-1 border-t border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 font-semibold uppercase px-1 mb-1">Calques & Plans</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        onInsertElementAtPosition?.('layer-foreground', caretPopover.targetId, caretInsertPosition);
                        setCaretPopover(null);
                      }}
                      className="p-1 bg-neutral-950 hover:bg-neutral-800 rounded border border-neutral-800 text-[10px] text-center text-indigo-300 font-semibold transition-colors"
                      title="Premier Plan"
                    >
                      1er Plan
                    </button>
                    <button
                      onClick={() => {
                        onInsertElementAtPosition?.('layer-midground', caretPopover.targetId, caretInsertPosition);
                        setCaretPopover(null);
                      }}
                      className="p-1 bg-neutral-950 hover:bg-neutral-800 rounded border border-neutral-800 text-[10px] text-center text-neutral-300 font-semibold transition-colors"
                      title="Plan Intermédiaire"
                    >
                      Interm.
                    </button>
                    <button
                      onClick={() => {
                        onInsertElementAtPosition?.('layer-background', caretPopover.targetId, caretInsertPosition);
                        setCaretPopover(null);
                      }}
                      className="p-1 bg-neutral-950 hover:bg-neutral-800 rounded border border-neutral-800 text-[10px] text-center text-neutral-400 font-semibold transition-colors"
                      title="Arrière-Plan"
                    >
                      Arrière
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onInsertElementAtPosition?.('divider', caretPopover.targetId, caretInsertPosition);
                    setCaretPopover(null);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded text-left transition-colors text-[11px]"
                >
                  <Minus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Séparateur</span>
                </button>
              </div>
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
