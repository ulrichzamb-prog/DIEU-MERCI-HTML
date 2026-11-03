import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Copy, 
  Check, 
  Wand2, 
  FileCode, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { formatHtml } from '../utils/htmlSanitizer';

interface CodeEditorProps {
  html: string;
  onApplyChanges: (newHtml: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ html, onApplyChanges }) => {
  const [code, setCode] = useState<string>(html);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // When external HTML updates (e.g. from visual changes)
  React.useEffect(() => {
    setCode(html);
    setIsSynced(true);
    setError(null);
  }, [html]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    setIsSynced(val === html);
  };

  const handleApply = () => {
    try {
      // Validate that HTML is parsable
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'text/html');
      const parserErrors = doc.querySelectorAll('parsererror');

      if (parserErrors.length > 0) {
        setError('Erreur de syntaxe HTML détectée dans le document.');
        return;
      }

      setError(null);
      onApplyChanges(code);
      setIsSynced(true);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la validation du code.');
    }
  };

  const handleFormat = () => {
    const beautified = formatHtml(code);
    setCode(beautified);
    setIsSynced(beautified === html);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Editor Top Control Bar */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-200">
              Source HTML Synchronisée
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Sync status */}
          {isSynced ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Synchronisé avec le visuel
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Modifications non appliquées
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-md transition-colors"
            title="Indenter et formater le code HTML"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Formater</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-md transition-colors"
            title="Copier tout le code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copié !' : 'Copier'}</span>
          </button>

          <button
            onClick={handleApply}
            disabled={isSynced}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all"
            title="Transmettre les modifications au rendu visuel"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Actualiser le Rendu</span>
          </button>
        </div>
      </div>

      {/* Error banner if present */}
      {error && (
        <div className="bg-red-950/60 border-b border-red-800 px-4 py-2 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="html"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: true },
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
};
