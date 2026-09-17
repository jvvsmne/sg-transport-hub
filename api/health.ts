const LTA_HEALTH_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts';

export default async function handler(req: any, res: any) {
  const apiKey = process.env.LTA_ACCOUNT_KEY?.trim();
  const keyConfigured = Boolean(apiKey && apiKey.length > 0);

  // If the API key is not configured, report early
  if (!keyConfigured || !apiKey) {
    const responseData = {
      ok: false,
      keyConfigured: false,
      lta: {
        reachable: false,
        status: null,
        statusText: 'LTA_ACCOUNT_KEY environment variable is not configured',
        authenticated: false,
        ms: 0,
        endpoint: 'TrainServiceAlerts',
      },
      reachable: false,
      status: null,
      ms: 0,
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(responseData);
    }
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseData));
      return;
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Make an authenticated request to LTA DataMall
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const ltaResponse = await fetch(LTA_HEALTH_ENDPOINT, {
      method: 'GET',
      headers: {
        AccountKey: apiKey,
        accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - startTime);
    const isSuccess = ltaResponse.ok;

    const responseData = {
      ok: isSuccess,
      keyConfigured: true,
      lta: {
        reachable: true,
        status: ltaResponse.status,
        statusText: ltaResponse.statusText || (isSuccess ? 'OK' : 'Error'),
        authenticated: isSuccess,
        ms: durationMs,
        endpoint: 'TrainServiceAlerts',
      },
      reachable: true,
      status: ltaResponse.status,
      ms: durationMs,
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(responseData);
    }
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseData));
      return;
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - startTime);

    const responseData = {
      ok: false,
      keyConfigured: true,
      lta: {
        reachable: false,
        status: null,
        statusText: err?.name === 'AbortError' ? 'Request timed out after 8000ms' : (err?.message || 'Connection failed'),
        authenticated: false,
        ms: durationMs,
        endpoint: 'TrainServiceAlerts',
      },
      reachable: false,
      status: null,
      ms: durationMs,
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(responseData);
    }
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseData));
      return;
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
