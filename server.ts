import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// The dev server must always bind to port 3000 (port 8080 is reserved for nginx ingress)
const PORT = 3000;

// Increase payload limit for base64 image uploads and conversions
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory server-side storage for Cloudinary credentials (never sent to client)
let serverCloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

// -------------------------------------------------------------
// Cloudinary API Endpoints (Zero secrets exposed to client)
// -------------------------------------------------------------

// 1. Get current configuration status
app.get('/api/cloudinary/status', (_req: Request, res: Response) => {
  const isConfigured = Boolean(
    serverCloudinaryConfig.cloudName &&
    serverCloudinaryConfig.apiKey &&
    serverCloudinaryConfig.apiSecret
  );

  res.json({
    isConfigured,
    cloudName: serverCloudinaryConfig.cloudName || null,
  });
});

// 2. Save credentials securely server-side
app.post('/api/cloudinary/config', (req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = req.body;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(400).json({ error: 'Cloud Name, API Key et API Secret sont requis.' });
    return;
  }

  serverCloudinaryConfig = {
    cloudName: String(cloudName).trim(),
    apiKey: String(apiKey).trim(),
    apiSecret: String(apiSecret).trim(),
  };

  res.json({
    success: true,
    cloudName: serverCloudinaryConfig.cloudName,
    message: 'Configuration Cloudinary enregistrée côté serveur avec succès.',
  });
});

// 3. Test real connection to Cloudinary
app.post('/api/cloudinary/test', async (_req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = serverCloudinaryConfig;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(400).json({
      success: false,
      error: 'Identifiants Cloudinary non configurés sur le serveur.',
    });
    return;
  }

  const startTime = Date.now();
  try {
    // Ping Cloudinary's Admin / Ping endpoint using Basic Auth
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        latency: `${latency}ms`,
        cloudName,
        message: 'Connexion à Cloudinary établie avec succès !',
        status: (data as any)?.status || 'OK',
      });
    } else {
      const errorText = await response.text();
      res.status(response.status).json({
        success: false,
        latency: `${latency}ms`,
        error: `Erreur Cloudinary HTTP ${response.status}: ${errorText}`,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Échec de connexion réseau vers Cloudinary: ${err?.message || 'Erreur inconnue'}`,
    });
  }
});

// 4. Secure upload endpoint: signs with api_secret server-side and uploads
app.post('/api/cloudinary/upload', async (req: Request, res: Response) => {
  const { cloudName, apiKey, apiSecret } = serverCloudinaryConfig;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(400).json({
      error: 'Veuillez configurer vos identifiants Cloudinary avant de téléverser.',
    });
    return;
  }

  const { file, folder = 'courrier_studio_emails', publicId } = req.body;

  if (!file) {
    res.status(400).json({ error: 'Fichier image manquant (base64 ou URL).' });
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build parameters to sign (sorted alphabetically)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };
    if (publicId) {
      paramsToSign.public_id = publicId;
    }

    const sortedQuery = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    // SHA-1 signature with API secret
    const signature = crypto
      .createHash('sha1')
      .update(sortedQuery + apiSecret)
      .digest('hex');

    // Prepare multipart/form-data payload via FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);
    if (publicId) {
      formData.append('public_id', publicId);
    }

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadRes.ok) {
      const result = await uploadRes.json();
      res.json({
        success: true,
        publicId: (result as any).public_id,
        secureUrl: (result as any).secure_url,
        url: (result as any).url,
        width: (result as any).width,
        height: (result as any).height,
        format: (result as any).format,
        bytes: (result as any).bytes,
      });
    } else {
      const errText = await uploadRes.text();
      res.status(uploadRes.status).json({
        error: `Erreur téléversement Cloudinary: ${errText}`,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      error: `Erreur interne lors du téléversement: ${err?.message || 'Erreur inconnue'}`,
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware & Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname || '.', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Courrier Studio Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already active, continuing...`);
    } else {
      console.error('[Server] Startup error:', err);
    }
  });
}

startServer();
