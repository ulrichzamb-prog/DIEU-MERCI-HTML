/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkspaceMode, EmailMetadata, SelectedElementInfo, TemplateDefinition } from './types/editor';
import { Header } from './components/Header';
import { SidebarLeft } from './components/SidebarLeft';
import { VisualCanvas } from './components/VisualCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { ImportModal } from './components/modals/ImportModal';
import { ExportModal } from './components/modals/ExportModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { SAMPLE_TEMPLATES } from './data/sampleTemplates';
import { sanitizeAndTagHtml, categorizeElement, generateElementId } from './utils/htmlSanitizer';
import { auditEmailHtml, autoFixEmailCompatibility, AuditResult } from './utils/emailCompatibility';

const STORAGE_KEY_HTML = 'courrier_studio_saved_html';
const STORAGE_KEY_META = 'courrier_studio_saved_meta';

export default function App() {
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('visual');
  const [documentTitle, setDocumentTitle] = useState<string>(SAMPLE_TEMPLATES[0].name);

  // Initialize with the first template
  const initialData = sanitizeAndTagHtml(SAMPLE_TEMPLATES[0].html);
  const [currentHtml, setCurrentHtml] = useState<string>(initialData.sanitizedHtml);
  const [metadata, setMetadata] = useState<EmailMetadata>(SAMPLE_TEMPLATES[0].metadata);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[]>([initialData.sanitizedHtml]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef(false);

  // Selected element in visual canvas
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // DOM Layer list extracted from current HTML
  const [domElements, setDomElements] = useState<Array<{ id: string; type: string; tagName: string; text: string; isLocked: boolean }>>([]);

  // Email Compatibility Audit
  const [auditResult, setAuditResult] = useState<AuditResult>(() => auditEmailHtml(initialData.sanitizedHtml));

  // Extract layer nodes whenever HTML changes
  const extractLayers = useCallback((html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const nodes = Array.from(doc.querySelectorAll('[data-cs-id]'));

      const layers = nodes.map((node) => {
        const el = node as HTMLElement;
        const type = categorizeElement(el);
        return {
          id: el.getAttribute('data-cs-id') || '',
          type,
          tagName: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().replace(/\s+/g, ' '),
          isLocked: el.getAttribute('data-cs-locked') === 'true',
        };
      });

      setDomElements(layers);
      setAuditResult(auditEmailHtml(html));
    } catch (err) {
      console.error('Error parsing layers:', err);
    }
  }, []);

  // Update HTML and push to history
  const updateHtml = useCallback((newHtml: string, shouldPushHistory = true) => {
    setCurrentHtml(newHtml);
    setIsSaved(false);
    extractLayers(newHtml);

    // Save to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY_HTML, newHtml);
    } catch {}

    if (shouldPushHistory && !isUndoRedoAction.current) {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        // Cap history at 50 snapshots
        const next = [...sliced, newHtml].slice(-50);
        setHistoryIndex(next.length - 1);
        return next;
      });
    }
    isUndoRedoAction.current = false;
  }, [historyIndex, extractLayers]);

  // Initial load: check LocalStorage
  useEffect(() => {
    try {
      const savedHtml = localStorage.getItem(STORAGE_KEY_HTML);
      const savedMeta = localStorage.getItem(STORAGE_KEY_META);
      if (savedHtml) {
        const { sanitizedHtml } = sanitizeAndTagHtml(savedHtml);
        setCurrentHtml(sanitizedHtml);
        setHistory([sanitizedHtml]);
        setHistoryIndex(0);
        extractLayers(sanitizedHtml);
      } else {
        extractLayers(initialData.sanitizedHtml);
      }
      if (savedMeta) {
        setMetadata(JSON.parse(savedMeta));
      }
    } catch {}
  }, []);

  // Metadata changes
  const handleUpdateMetadata = (partial: Partial<EmailMetadata>) => {
    setMetadata((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex - 1;
      const prevHtml = history[targetIndex];
      setHistoryIndex(targetIndex);
      setCurrentHtml(prevHtml);
      extractLayers(prevHtml);
      setSelectedElement(null);
    }
  }, [history, historyIndex, extractLayers]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex + 1;
      const nextHtml = history[targetIndex];
      setHistoryIndex(targetIndex);
      setCurrentHtml(nextHtml);
      extractLayers(nextHtml);
      setSelectedElement(null);
    }
  }, [history, historyIndex, extractLayers]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !selectedElement.isLocked) {
          e.preventDefault();
          handleDeleteElement(selectedElement.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedElement]);

  // Insert an element into the document
  const handleInsertElement = (elementType: string) => {
    const newId = generateElementId();
    let snippet = '';

    switch (elementType) {
      case 'heading-1':
        snippet = `<h1 data-cs-id="${newId}" style="font-size: 28px; line-height: 36px; color: #0f172a; margin: 16px 0 10px 0; font-weight: bold; font-family: Arial, sans-serif;">Nouveau Titre Principal</h1>`;
        break;
      case 'heading-2':
        snippet = `<h2 data-cs-id="${newId}" style="font-size: 20px; line-height: 28px; color: #1e293b; margin: 14px 0 8px 0; font-weight: 600; font-family: Arial, sans-serif;">Sous-titre de Section</h2>`;
        break;
      case 'paragraph':
        snippet = `<p data-cs-id="${newId}" style="font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 14px 0; font-family: Arial, sans-serif;">Insérez votre texte ici. Vous pouvez double-cliquer pour éditer ce contenu directement dans le canvas.</p>`;
        break;
      case 'button':
        snippet = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 16px 0;"><tr><td align="center" style="border-radius: 6px; background-color: #4f46e5;"><a data-cs-id="${newId}" href="https://example.com" style="background-color: #4f46e5; border: 1px solid #4f46e5; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 28px; color: #ffffff; border-radius: 6px; display: inline-block;">Cliquez ici &rarr;</a></td></tr></table>`;
        break;
      case 'image':
        snippet = `<img data-cs-id="${newId}" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22600%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e0e7ff%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%234338ca%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%3EImage%20ou%20Logo%3C%2Ftext%3E%3C%2Fsvg%3E" alt="Nouvelle image" width="560" style="width: 100%; max-width: 560px; height: auto; border-radius: 6px; display: block; margin: 16px auto;" />`;
        break;
      case 'two-columns':
        snippet = `<table data-cs-id="${newId}" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;"><tr><td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;"><h3 style="font-size: 16px; margin: 0 0 6px 0; color: #0f172a; font-family: Arial, sans-serif;">Colonne 1</h3><p style="font-size: 14px; margin: 0; color: #64748b; font-family: Arial, sans-serif;">Contenu de la première colonne.</p></td><td width="4%">&nbsp;</td><td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;"><h3 style="font-size: 16px; margin: 0 0 6px 0; color: #0f172a; font-family: Arial, sans-serif;">Colonne 2</h3><p style="font-size: 14px; margin: 0; color: #64748b; font-family: Arial, sans-serif;">Contenu de la seconde colonne.</p></td></tr></table>`;
        break;
      case 'callout':
        snippet = `<table data-cs-id="${newId}" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;"><tr><td style="padding: 18px 24px; font-family: Arial, sans-serif;"><div style="font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">Information importante</div><div style="font-size: 14px; line-height: 22px; color: #1e3a8a;">Ce bloc met en avant un message clé pour vos lecteurs.</div></td></tr></table>`;
        break;
      case 'divider':
        snippet = `<hr data-cs-id="${newId}" style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`;
        break;
      case 'spacer':
        snippet = `<div data-cs-id="${newId}" style="height: 24px; line-height: 24px; font-size: 24px;">&nbsp;</div>`;
        break;
      default:
        return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');

    // If an element is selected, insert directly after it!
    let inserted = false;
    if (selectedElement) {
      const targetEl = doc.querySelector(`[data-cs-id="${selectedElement.id}"]`);
      if (targetEl && targetEl.parentElement) {
        const tempContainer = doc.createElement('div');
        tempContainer.innerHTML = snippet;
        const newEl = tempContainer.firstElementChild;
        if (newEl) {
          targetEl.parentElement.insertBefore(newEl, targetEl.nextSibling);
          inserted = true;
        }
      }
    }

    // Otherwise, append to main container or body
    if (!inserted) {
      const mainContainer = doc.querySelector('table[style*="max-width"]') || doc.body;
      const tempContainer = doc.createElement('div');
      tempContainer.innerHTML = snippet;
      const newEl = tempContainer.firstElementChild;
      if (newEl) {
        mainContainer.appendChild(newEl);
      }
    }

    const newHtml = doc.documentElement.outerHTML;
    updateHtml(newHtml);
  };

  // Duplicate an element
  const handleDuplicateElement = (id: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${id}"]`);

    if (target && target.parentElement) {
      const clone = target.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-cs-id', generateElementId());
      target.parentElement.insertBefore(clone, target.nextSibling);

      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);
    }
  };

  // Delete an element
  const handleDeleteElement = (id: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${id}"]`);

    if (target) {
      target.remove();
      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);
      setSelectedElement(null);
    }
  };

  // Lock / Unlock toggle
  const handleToggleLock = (id: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${id}"]`);

    if (target) {
      const currentLocked = target.getAttribute('data-cs-locked') === 'true';
      if (currentLocked) {
        target.removeAttribute('data-cs-locked');
      } else {
        target.setAttribute('data-cs-locked', 'true');
      }

      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);

      if (selectedElement && selectedElement.id === id) {
        setSelectedElement({ ...selectedElement, isLocked: !currentLocked });
      }
    }
  };

  // Move element up or down in the DOM
  const handleMoveElement = (id: string, direction: 'up' | 'down') => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${id}"]`);

    if (target && target.parentElement) {
      if (direction === 'up') {
        const prev = target.previousElementSibling;
        if (prev) {
          target.parentElement.insertBefore(target, prev);
        }
      } else {
        const next = target.nextElementSibling;
        if (next) {
          target.parentElement.insertBefore(next, target);
        }
      }
      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);
    }
  };

  // Update styles from Properties panel
  const handleUpdateStyle = (styles: Partial<SelectedElementInfo['styles']>) => {
    if (!selectedElement) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;

    if (target) {
      Object.entries(styles).forEach(([prop, val]) => {
        if (val !== undefined) {
          // Convert camelCase to kebab-case
          const kebabProp = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
          target.style.setProperty(kebabProp, String(val));
        }
      });

      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);

      setSelectedElement({
        ...selectedElement,
        styles: { ...selectedElement.styles, ...styles },
      });
    }
  };

  // Update attributes (href, src, alt)
  const handleUpdateAttribute = (attributes: Partial<SelectedElementInfo['attributes']>) => {
    if (!selectedElement) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;

    if (target) {
      Object.entries(attributes).forEach(([attr, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          target.setAttribute(attr, String(val));
        } else {
          target.removeAttribute(attr);
        }
      });

      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);

      setSelectedElement({
        ...selectedElement,
        attributes: { ...selectedElement.attributes, ...attributes },
      });
    }
  };

  // Update text content
  const handleUpdateText = (text: string) => {
    if (!selectedElement) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${selectedElement.id}"]`) as HTMLElement;

    if (target) {
      target.textContent = text;
      const newHtml = doc.documentElement.outerHTML;
      updateHtml(newHtml);

      setSelectedElement({
        ...selectedElement,
        text,
      });
    }
  };

  // Select element by ID from layers list
  const handleSelectById = (id: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    const target = doc.querySelector(`[data-cs-id="${id}"]`) as HTMLElement;

    if (target) {
      const type = categorizeElement(target);
      const rect = target.getBoundingClientRect();
      const computed = window.getComputedStyle(target);

      setSelectedElement({
        id,
        tagName: target.tagName.toLowerCase(),
        type,
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
      });
    }
  };

  // Auto-fix compatibility issues in 1-click
  const handleAutoFixCompatibility = () => {
    const fixedHtml = autoFixEmailCompatibility(currentHtml);
    updateHtml(fixedHtml);
  };

  // Import handler
  const handleImportSuccess = (newHtml: string, name: string) => {
    setDocumentTitle(name.replace(/\.[^/.]+$/, ''));
    updateHtml(newHtml);
    setSelectedElement(null);
  };

  // Template select handler
  const handleSelectTemplate = (template: TemplateDefinition) => {
    setDocumentTitle(template.name);
    setMetadata(template.metadata);
    const { sanitizedHtml } = sanitizeAndTagHtml(template.html);
    updateHtml(sanitizedHtml);
    setSelectedElement(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isSaved={isSaved}
        documentTitle={documentTitle}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Mode 1: ÉDITION VISUELLE */}
        {currentMode === 'visual' && (
          <>
            {/* Left Tools & DOM Layers Sidebar */}
            <SidebarLeft
              onInsertElement={handleInsertElement}
              domElements={domElements}
              selectedElementId={selectedElement?.id || null}
              onSelectElement={handleSelectById}
              onDeleteElement={handleDeleteElement}
              onToggleLock={handleToggleLock}
              onMoveElement={handleMoveElement}
              auditResult={auditResult}
              onAutoFixCompatibility={handleAutoFixCompatibility}
              metadata={metadata}
              onUpdateMetadata={handleUpdateMetadata}
            />

            {/* Central Interactive Canvas */}
            <VisualCanvas
              html={currentHtml}
              onHtmlChange={(newHtml) => updateHtml(newHtml)}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onDuplicateElement={handleDuplicateElement}
              onDeleteElement={handleDeleteElement}
              onToggleLock={handleToggleLock}
              onUpdateElementStyle={(id, styles) => handleUpdateStyle(styles)}
            />

            {/* Right Element Properties Panel */}
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateStyle={handleUpdateStyle}
              onUpdateAttribute={handleUpdateAttribute}
              onUpdateText={handleUpdateText}
              onDuplicate={() => selectedElement && handleDuplicateElement(selectedElement.id)}
              onDelete={() => selectedElement && handleDeleteElement(selectedElement.id)}
              onToggleLock={() => selectedElement && handleToggleLock(selectedElement.id)}
            />
          </>
        )}

        {/* Workspace Mode 2: ÉDITION DU CODE HTML */}
        {currentMode === 'code' && (
          <CodeEditor
            html={currentHtml}
            onApplyChanges={(newCode) => {
              const { sanitizedHtml } = sanitizeAndTagHtml(newCode);
              updateHtml(sanitizedHtml);
            }}
          />
        )}

        {/* Workspace Mode 3: APERÇU FINAL */}
        {currentMode === 'preview' && (
          <PreviewPanel html={currentHtml} metadata={metadata} />
        )}
      </div>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        html={currentHtml}
        documentTitle={documentTitle}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
