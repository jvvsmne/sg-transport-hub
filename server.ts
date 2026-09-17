import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  getLtaStatus,
  getLiveBusStops,
  getLiveBusArrivals,
  getLiveTrainAlerts,
  getLiveCrowdDensity,
  getLiveTrainStations,
} from './src/services/ltaService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes FIRST
app.get('/api/health', (req, res) => {
  const ltaApiKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY.trim().length > 0
  );
  res.json({
    ok: true,
    ltaApiKeyConfigured,
  });
});

// LTA API Test endpoint
app.get('/api/lta-test', async (req, res) => {
  const apiKey = process.env.LTA_ACCOUNT_KEY?.trim();
  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      authenticated: false,
      message: 'LTA_ACCOUNT_KEY environment variable is not configured on the server.',
    });
  }

  try {
    const ltaResponse = await fetch('https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts', {
      headers: {
        AccountKey: apiKey,
        accept: 'application/json',
      },
    });

    if (ltaResponse.ok) {
      return res.json({
        ok: true,
        authenticated: true,
        statusCode: ltaResponse.status,
        message: 'Successfully authenticated with Singapore LTA DataMall API.',
        endpointTested: 'TrainServiceAlerts',
      });
    } else {
      return res.status(ltaResponse.status).json({
        ok: false,
        authenticated: false,
        statusCode: ltaResponse.status,
        statusText: ltaResponse.statusText,
        message: `LTA DataMall rejected the request with status ${ltaResponse.status} (${ltaResponse.statusText}). Verify that your LTA_ACCOUNT_KEY is valid.`,
      });
    }
  } catch (err: any) {
    return res.status(502).json({
      ok: false,
      authenticated: false,
      message: `Failed to connect to LTA DataMall: ${err?.message || 'Network error'}`,
    });
  }
});

// LTA Status check
app.get('/api/status', (req, res) => {
  const status = getLtaStatus();
  res.json(status);
});

// Live Bus Stops
app.get('/api/lta/bus-stops', async (req, res) => {
  try {
    const result = await getLiveBusStops();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bus stops' });
  }
});

// Live Bus Arrivals for a stop
app.get('/api/lta/bus-arrivals', async (req, res) => {
  const busStopCode = req.query.busStopCode as string;
  const serviceNo = req.query.serviceNo as string | undefined;

  if (!busStopCode) {
    return res.status(400).json({ error: 'busStopCode query parameter is required' });
  }

  try {
    const result = await getLiveBusArrivals(busStopCode, serviceNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bus arrivals' });
  }
});

// Live Train Service Alerts
app.get('/api/lta/train-alerts', async (req, res) => {
  try {
    const result = await getLiveTrainAlerts();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch train alerts' });
  }
});

// Live Platform Crowd Density
app.get('/api/lta/crowd-density', async (req, res) => {
  const trainLine = req.query.trainLine as string;
  try {
    const result = await getLiveCrowdDensity(trainLine);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch crowd density' });
  }
});

// Live Train Stations (with integrated crowd density)
app.get('/api/lta/train-stations', async (req, res) => {
  try {
    const result = await getLiveTrainStations();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch train stations' });
  }
});

// Vite middleware for development & static serving for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`SG Transport Hub server running on port ${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
