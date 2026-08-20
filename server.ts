import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const PYTHON_PORT = 5050;

app.use(express.json({ limit: '10mb' }));

// Spawn Modular Python Backend Subprocess
let pythonProcess: ChildProcess | null = null;
let isPythonReady = false;

function startPythonBackend() {
  console.log(`🐍 Launching Modular Python Backend on port ${PYTHON_PORT}...`);
  // Use 'python' on Windows and 'python3' on Linux/Mac
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  pythonProcess = spawn(pythonCmd, ['-m', 'backend.main'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PYTHON_BACKEND_PORT: String(PYTHON_PORT),
      PYTHON_BACKEND_HOST: '127.0.0.1',
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  pythonProcess.on('error', (err) => {
    console.error('❌ Failed to start Python backend:', err);
    isPythonReady = false;
  });

  pythonProcess.on('exit', (code, signal) => {
    console.warn(`⚠️ Python backend exited with code ${code} and signal ${signal}`);
    isPythonReady = false;
    // Auto-restart after 1 second if unexpected exit
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      setTimeout(startPythonBackend, 1000);
    }
  });
}

// Start Python Backend
startPythonBackend();

// Clean Process Exit Handling
process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill('SIGINT');
  process.exit(0);
});

// Helper function to proxy requests to Python backend with retry
function forwardToPython(
  req: express.Request,
  res: express.Response,
  retryCount = 0
) {
  const isPostOrPut = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  const bodyData = isPostOrPut && req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null;

  const headers: Record<string, string | string[] | undefined> = {
    ...req.headers,
    host: `127.0.0.1:${PYTHON_PORT}`,
  };

  if (bodyData) {
    headers['content-type'] = 'application/json';
    headers['content-length'] = String(Buffer.byteLength(bodyData));
  }

  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: PYTHON_PORT,
    path: req.originalUrl,
    method: req.method,
    headers,
    timeout: 8000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (retryCount < 3) {
      // Retry after 200ms if backend is warming up
      setTimeout(() => forwardToPython(req, res, retryCount + 1), 200);
      return;
    }

    console.error('Proxy Error reaching Python backend:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Bad Gateway: Python backend is initializing or unavailable.',
        details: err.message,
      });
    }
  });

  if (bodyData) {
    proxyReq.write(bodyData);
  }
  proxyReq.end();
}

// Proxy Middleware for /api/* Routes to Python Backend
app.all('/api/*', (req, res) => {
  forwardToPython(req, res, 0);
});

// Vite Middleware for Dev, Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on http://0.0.0.0:${PORT} (Proxying /api to Python Backend on :${PYTHON_PORT})`);
  });
}

startServer();
