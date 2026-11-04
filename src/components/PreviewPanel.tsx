import React, { useState } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Moon, 
  Sun, 
  Printer, 
  Mail, 
  Star, 
  Reply, 
  MoreVertical,
  ExternalLink,
  Download
} from 'lucide-react';
import { DeviceViewport, EmailMetadata } from '../types/editor';

interface PreviewPanelProps {
  html: string;
  metadata: EmailMetadata;
  onOpenExport?: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ html, metadata, onOpenExport }) => {
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [clientType, setClientType] = useState<'gmail' | 'apple' | 'outlook'>('gmail');

  const getContainerWidth = () => {
    switch (viewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '640px';
      case 'desktop':
      default:
        return '840px';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Top Preview Toolbar */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
        {/* Client selector & Device Viewports */}
        <div className="flex items-center gap-3">
          {/* Email Client Choice */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setClientType('gmail')}
              className={`px-2.5 py-1 rounded transition-colors ${
                clientType === 'gmail' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Gmail
            </button>
            <button
              onClick={() => setClientType('apple')}
              className={`px-2.5 py-1 rounded transition-colors ${
                clientType === 'apple' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Apple Mail
            </button>
            <button
              onClick={() => setClientType('outlook')}
              className={`px-2.5 py-1 rounded transition-colors ${
                clientType === 'outlook' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Outlook
            </button>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Viewports */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded transition-colors ${
                viewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Bureau"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded transition-colors ${
                viewport === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Tablette"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded transition-colors ${
                viewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Simulator */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                : 'bg-neutral-850 border-neutral-700/60 text-neutral-300 hover:text-white'
            }`}
            title="Simuler le mode sombre de messagerie"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            <span>Mode Sombre Client</span>
          </button>

          {/* Print preview */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            title="Imprimer / Enregistrer en PDF via navigateur"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>

          {/* Export Template Button */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
              title="Exporter le template HTML, PDF, DOCX, ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter le Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Container with Simulated Client Header */}
      <div className={`flex-1 overflow-auto p-8 flex justify-center transition-colors ${
        isDarkMode ? 'bg-[#18191a]' : 'bg-[#f6f8fc]'
      }`}>
        <div
          className={`shadow-2xl rounded-xl overflow-hidden border transition-all duration-200 flex flex-col ${
            isDarkMode ? 'bg-[#202124] border-[#3c4043] text-neutral-200' : 'bg-white border-neutral-300 text-neutral-900'
          }`}
          style={{ width: getContainerWidth(), minHeight: '850px' }}
        >
          {/* Simulated Email Client Header (e.g. Gmail chrome) */}
          <div className={`p-5 border-b shrink-0 ${isDarkMode ? 'border-[#3c4043] bg-[#292a2d]' : 'border-neutral-200 bg-neutral-50/50'}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-xl font-bold tracking-tight leading-snug">
                {metadata.subject || 'Sans objet'}
              </h2>
              <div className="flex items-center gap-1 text-neutral-400">
                <Star className="w-4 h-4 cursor-pointer hover:text-amber-400" />
                <Reply className="w-4 h-4 cursor-pointer hover:text-neutral-200 ml-1" />
                <MoreVertical className="w-4 h-4 cursor-pointer hover:text-neutral-200" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {(metadata.senderName || 'C')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {metadata.senderName || 'Courrier Studio'}
                  </span>
                  <span className="text-neutral-400 truncate">
                    &lt;{metadata.senderEmail || 'contact@domaine.fr'}&gt;
                  </span>
                </div>
                <div className="text-neutral-400 text-[11px] mt-0.5 truncate">
                  À moi &bull; Aujourd'hui à 14h30
                </div>
              </div>
            </div>

            {/* Preheader banner */}
            {metadata.preheader && (
              <div className="mt-3 pt-2.5 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[11px] text-neutral-500 italic">
                <span className="font-semibold not-italic text-neutral-400">Pré-en-tête : </span>
                {metadata.preheader}
              </div>
            )}
          </div>

          {/* Email Body Rendering */}
          <div className="flex-1 bg-white">
            <iframe
              srcDoc={html}
              title="Aperçu Réel"
              className="w-full h-full min-h-[750px] border-0"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
