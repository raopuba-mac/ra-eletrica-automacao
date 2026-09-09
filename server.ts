import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './server/config/index.js';
import chatRouter from './server/routes/chat.js';
import voiceRouter from './server/routes/voice.js';
import notificationsRouter from './server/routes/notifications.js';
import cronRouter from './server/routes/cron.js';
import publicOsRouter from './server/routes/publicOs.js';
import { startScheduler } from './server/services/scheduler.service.js';
import { errorHandler } from './server/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global body parser
app.use(express.json());

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type,Authorization'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount modular API routers
app.use('/api', chatRouter);
app.use('/api', voiceRouter);
app.use('/api', notificationsRouter);
app.use('/api', cronRouter);
app.use('/api', publicOsRouter);

// Global Error Handler for API routes
app.use(errorHandler);

// Vite middleware and server startup
async function setupViteAndListen() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // Only listen and start scheduler if NOT running in serverless environment (Vercel)
    if (!config.isVercel) {
      app.listen(config.port, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${config.port}`);
      });

      // Start background scheduler
      startScheduler(30000);
    } else {
      console.log(
        '[Push Server] Executando em ambiente Serverless (Vercel). Escuta de porta desativada.'
      );
    }
  } catch (err) {
    console.error(
      '[Server Start Error] Erro ao inicializar o servidor Express/Vite:',
      err
    );
  }
}

setupViteAndListen().catch((err) => {
  console.error('[Server Start Fatal Error]', err);
});

export default app;
