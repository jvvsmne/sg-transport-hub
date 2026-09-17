const LTA_TEST_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts';

export default async function handler(req: any, res: any) {
  const apiKey = process.env.LTA_ACCOUNT_KEY?.trim();

  // Check if API key is present in server-side environment
  if (!apiKey) {
    const errorData = {
      ok: false,
      authenticated: false,
      message: 'LTA_ACCOUNT_KEY environment variable is not configured on the server.',
    };

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(400).json(errorData);
    }
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(errorData));
      return;
    }
    return new Response(JSON.stringify(errorData), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Perform a minimal authenticated request to Singapore LTA DataMall
    const ltaResponse = await fetch(LTA_TEST_ENDPOINT, {
      method: 'GET',
      headers: {
        AccountKey: apiKey,
        accept: 'application/json',
      },
    });

    if (ltaResponse.ok) {
      const successData = {
        ok: true,
        authenticated: true,
        statusCode: ltaResponse.status,
        message: 'Successfully authenticated with Singapore LTA DataMall API.',
        endpointTested: 'TrainServiceAlerts',
      };

      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(200).json(successData);
      }
      if (res && typeof res.setHeader === 'function') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(successData));
        return;
      }
      return new Response(JSON.stringify(successData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const failureData = {
        ok: false,
        authenticated: false,
        statusCode: ltaResponse.status,
        statusText: ltaResponse.statusText,
        message: `LTA DataMall rejected the request with status ${ltaResponse.status} (${ltaResponse.statusText}). Verify that your LTA_ACCOUNT_KEY is valid.`,
      };

      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(ltaResponse.status).json(failureData);
      }
      if (res && typeof res.setHeader === 'function') {
        res.statusCode = ltaResponse.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(failureData));
        return;
      }
      return new Response(JSON.stringify(failureData), {
        status: ltaResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    const errorData = {
      ok: false,
      authenticated: false,
      message: `Failed to connect to LTA DataMall: ${err?.message || 'Network error'}`,
    };

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(502).json(errorData);
    }
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(errorData));
      return;
    }
    return new Response(JSON.stringify(errorData), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
