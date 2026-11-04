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
  Lock,
  Server,
  Code
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

export type HostingProviderType = 'cloudinary' | 'local_server' | 'base64_direct';

export const CloudinaryModal: React.FC<CloudinaryModalProps> = ({
  isOpen,
  onClose,
  html,
  onUpdateHtmlImages,
}) => {
  const [activeProvider, setActiveProvider] = useState<HostingProviderType>('cloudinary');

  // Configuration credentials state for Cloudinary
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

      const isHosted = src.includes('res.cloudinary.com') || src.includes('/api/hosting/images/');
      items.push({
        id: `img-${idx}`,
        originalSrc: src,
        elementId: img.getAttribute('data-cs-id') || undefined,
        status: isHosted ? 'hosted' : 'pending',
        hostedUrl: isHosted ? src : undefined,
      });
    });

    setDetectedImages(items);
  };

  // Save Cloudinary credentials securely to server
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

  // Upload an individual image according to active provider
  const uploadSingleImage = async (item: CloudinaryImageItem): Promise<string | null> => {
    setDetectedImages((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
    );

    try {
      if (activeProvider === 'local_server') {
        const res = await fetch('/api/hosting/local-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: item.originalSrc }),
        });
        if (!res.ok) throw new Error("Échec d'hébergement serveur local");
        const data = await res.json();
        const secureUrl = data.secureUrl;
        setDetectedImages((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'hosted', hostedUrl: secureUrl, bytes: data.bytes } : i
          )
        );
        return secureUrl;
      } else if (activeProvider === 'base64_direct') {
        // Keeps raw base64 or SVG data inline
        setDetectedImages((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'hosted', hostedUrl: item.originalSrc } : i
          )
        );
        return item.originalSrc;
      } else {
        // Cloudinary
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
      }
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
                  Hébergement d'Images & Logos Multi-Options
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                Choix entre Cloudinary (HTTPS public), Serveur Local direct ou Base64 autonome
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

        {/* Provider Switcher Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveProvider('cloudinary')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeProvider === 'cloudinary'
                ? 'border-sky-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>1. Cloudinary API</span>
          </button>

          <button
            onClick={() => setActiveProvider('local_server')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeProvider === 'local_server'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Serveur Local Direct</span>
          </button>

          <button
            onClick={() => setActiveProvider('base64_direct')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeProvider === 'base64_direct'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Base64 Autonome</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Provider 1: Cloudinary Configuration Box */}
          {activeProvider === 'cloudinary' && (
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Identifiants Cloudinary Sécurisés
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
                    placeholder="••••••••••••"
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
                    <span className="font-semibold">{testResult.message}</span>
                    {testResult.latency && (
                      <span className="text-[10px] text-neutral-400 ml-2">({testResult.latency})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Provider 2: Local Server Hosting */}
          {activeProvider === 'local_server' && (
            <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Server className="w-4 h-4" />
                <span>Hébergement Direct sur le Serveur de l'Application</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Les images sont stockées et servies directement par les routes <code>/api/hosting/images/:id</code>. Aucun compte externe ni clé d'API n'est nécessaire.
              </p>
              <div className="p-2 bg-neutral-950 rounded border border-neutral-800 text-[11px] text-neutral-400">
                ✓ Prêt à l'emploi immédiatement sans configuration externe.
              </div>
            </div>
          )}

          {/* Provider 3: Base64 Direct */}
          {activeProvider === 'base64_direct' && (
            <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Code className="w-4 h-4" />
                <span>Intégration Directe Base64 (Data URI)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Les images et logos sont encodés directement dans le code source HTML sous forme de données Base64 autonomes. Ne nécessite aucun serveur d'hébergement.
              </p>
              <div className="p-2 bg-neutral-950 rounded border border-neutral-800 text-[11px] text-neutral-400">
                ✓ 100% autonome, idéal pour les maquettes, les tests et les logos SVG.
              </div>
            </div>
          )}

          {/* Images detected list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Images du Template ({detectedImages.length})</span>
              </span>

              {detectedImages.length > 0 && (
                <button
                  onClick={handleUploadAllImages}
                  disabled={isUploadingAll || detectedImages.every((i) => i.status === 'hosted')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isUploadingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Appliquer l'Hébergement Choisi</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {detectedImages.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-500 text-xs">
                Aucune image détectée dans le document email actuel.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {detectedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded border border-neutral-800 bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={img.hostedUrl || img.originalSrc}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-mono text-[11px] text-neutral-300 max-w-[320px]">
                          {img.hostedUrl || img.originalSrc}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {img.status === 'hosted' ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Hébergée avec succès
                            </span>
                          ) : img.status === 'uploading' ? (
                            <span className="text-sky-400 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> En cours...
                            </span>
                          ) : (
                            <span className="text-amber-400">En attente d'hébergement</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {img.status !== 'hosted' && (
                      <button
                        onClick={() => uploadSingleImage(img)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-sky-600 text-neutral-300 hover:text-white rounded text-[11px] font-semibold transition-colors shrink-0"
                      >
                        Héberger
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
