import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Upload, 
  Check, 
  RefreshCw, 
  Image as ImageIcon,
  ExternalLink,
  Lock
} from 'lucide-react';

interface CloudinaryImageItem {
  id: string;
  originalSrc: string;
  elementId?: string;
  status: 'hosted' | 'pending' | 'uploading' | 'error';
  hostedUrl?: string;
  bytes?: number;
  error?: string;
}

interface CloudinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  onUpdateHtmlImages: (updatedHtml: string) => void;
}

export const CloudinaryModal: React.FC<CloudinaryModalProps> = ({
  isOpen,
  onClose,
  html,
  onUpdateHtmlImages,
}) => {
  // Configuration credentials state (sent directly to server, never stored in client localStorage)
  const [cloudName, setCloudName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');

  const [isConfiguredOnServer, setIsConfiguredOnServer] = useState<boolean>(false);
  const [serverCloudName, setServerCloudName] = useState<string | null>(null);

  // Testing connection state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: string;
  } | null>(null);

  // Images list detected in the email
  const [detectedImages, setDetectedImages] = useState<CloudinaryImageItem[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState<boolean>(false);

  // Check server configuration status on mount
  useEffect(() => {
    if (isOpen) {
      checkServerStatus();
      scanEmailImages();
    }
  }, [isOpen, html]);

  const checkServerStatus = async () => {
    try {
      const res = await fetch('/api/cloudinary/status');
      if (res.ok) {
        const data = await res.json();
        setIsConfiguredOnServer(data.isConfigured);
        setServerCloudName(data.cloudName);
        if (data.cloudName) {
          setCloudName(data.cloudName);
        }
      }
    } catch (err) {
      console.error('Error fetching Cloudinary status:', err);
    }
  };

  // Scan current HTML document for images
  const scanEmailImages = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img'));

    const items: CloudinaryImageItem[] = [];
    imgs.forEach((img, idx) => {
      const src = img.getAttribute('src') || '';
      if (!src) return;

      const isAlreadyCloudinary = src.includes('res.cloudinary.com');
      items.push({
        id: `img-${idx}`,
        originalSrc: src,
        elementId: img.getAttribute('data-cs-id') || undefined,
        status: isAlreadyCloudinary ? 'hosted' : 'pending',
        hostedUrl: isAlreadyCloudinary ? src : undefined,
      });
    });

    setDetectedImages(items);
  };

  // Save credentials securely to server
  const handleSaveCredentials = async () => {
    if (!cloudName || !apiKey || !apiSecret) return;

    try {
      const res = await fetch('/api/cloudinary/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudName, apiKey, apiSecret }),
      });

      if (res.ok) {
        setIsConfiguredOnServer(true);
        setServerCloudName(cloudName);
        setApiSecret(''); // Clear secret from frontend memory immediately
        await handleTestConnection();
      }
    } catch (err) {
      console.error('Error saving Cloudinary config:', err);
    }
  };

  // Test real connection to Cloudinary API via server proxy
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/cloudinary/test', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connexion Cloudinary active !',
          latency: data.latency,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Identifiants Cloudinary invalides ou réseau inaccessible.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erreur lors du test de connexion.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Upload an individual image to Cloudinary via server proxy
  const uploadSingleImage = async (item: CloudinaryImageItem): Promise<string | null> => {
    setDetectedImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
    );

    try {
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: item.originalSrc,
          folder: 'courrier_studio_emails',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Échec du téléversement');
      }

      const data = await res.json();
      const secureUrl = data.secureUrl;

      setDetectedImages((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'hosted', hostedUrl: secureUrl, bytes: data.bytes }
            : i
        )
      );

      return secureUrl;
    } catch (err: any) {
      setDetectedImages((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: err?.message } : i
        )
      );
      return null;
    }
  };

  // Upload all pending images and update email HTML
  const handleUploadAllImages = async () => {
    setIsUploadingAll(true);
    const replacements: Record<string, string> = {};

    for (const item of detectedImages) {
      if (item.status === 'pending' || item.status === 'error') {
        const secureUrl = await uploadSingleImage(item);
        if (secureUrl) {
          replacements[item.originalSrc] = secureUrl;
        }
      }
    }

    // Replace original image URLs in the document with the new HTTPS Cloudinary URLs
    if (Object.keys(replacements).length > 0) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      doc.querySelectorAll('img').forEach((img) => {
        const currentSrc = img.getAttribute('src');
        if (currentSrc && replacements[currentSrc]) {
          img.setAttribute('src', replacements[currentSrc]);
        }
      });

      const updatedHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      onUpdateHtmlImages(updatedHtml);
    }

    setIsUploadingAll(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Hébergement Public Cloudinary
                </h2>
                {isConfiguredOnServer ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                    Configuré ({serverCloudName})
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
                    Non configuré
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Hébergez vos logos et visuels en HTTPS public sans exposer vos clés secrètes
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Credentials Configuration Box */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Identifiants Serveur Sécurisés
              </span>
              <span className="text-[10px] text-neutral-500">
                Conservés strictement côté serveur
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Cloud Name</label>
                <input
                  type="text"
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  placeholder="votre_cloud_name"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="1234567890"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSaveCredentials}
                disabled={!cloudName || !apiKey || !apiSecret}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded text-xs font-semibold transition-all"
              >
                Enregistrer la Configuration
              </button>

              <button
                onClick={handleTestConnection}
                disabled={isTesting || (!isConfiguredOnServer && (!cloudName || !apiKey || !apiSecret))}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Tester la Connexion Réelle</span>
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/40 border border-red-800 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span>{testResult.message}</span>
                  {testResult.latency && (
                    <span className="ml-2 font-mono text-[10px] text-emerald-400">
                      (Latence: {testResult.latency})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detected Images in Template */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">
                  Images Détectées dans le Template ({detectedImages.length})
                </div>
                <div className="text-[11px] text-neutral-400">
                  Les images locales ou base64 peuvent être hébergées en HTTPS public et réinjectées automatiquement.
                </div>
              </div>

              <button
                onClick={handleUploadAllImages}
                disabled={
                  isUploadingAll ||
                  !isConfiguredOnServer ||
                  detectedImages.filter((i) => i.status === 'pending').length === 0
                }
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isUploadingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Téléverser & Remplacer Tout</span>
              </button>
            </div>

            {detectedImages.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-lg border border-neutral-800">
                Aucune image détectée dans cet email.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {detectedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={img.hostedUrl || img.originalSrc}
                        alt="Aperçu"
                        className="w-8 h-8 rounded object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-mono text-neutral-300 text-[11px] truncate block">
                          {img.hostedUrl || img.originalSrc.slice(0, 48) + '...'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {img.status === 'hosted' && (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Hébergée
                        </span>
                      )}
                      {img.status === 'pending' && (
                        <span className="text-[11px] text-amber-400">En attente</span>
                      )}
                      {img.status === 'uploading' && (
                        <span className="text-[11px] text-sky-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> En cours...
                        </span>
                      )}
                      {img.status === 'error' && (
                        <span className="text-[11px] text-red-400">Erreur</span>
                      )}

                      {img.hostedUrl && (
                        <a
                          href={img.hostedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-neutral-400 hover:text-white"
                          title="Voir l'image publique"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-950/70 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Sécurité : Les secrets API ne transitent jamais dans le navigateur public</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
