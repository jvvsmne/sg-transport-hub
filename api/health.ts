export default async function handler(req: any, res: any) {
  // Check whether LTA_ACCOUNT_KEY is available server-side without exposing it
  const ltaApiKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY.trim().length > 0
  );

  const responseData = {
    ok: true,
    ltaApiKeyConfigured,
  };

  // Vercel Serverless Function response (Node.js runtime)
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(responseData);
  }

  // Node.js IncomingMessage / ServerResponse fallback
  if (res && typeof res.setHeader === 'function') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responseData));
    return;
  }

  // Web Standard Response fallback (Edge runtime)
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
