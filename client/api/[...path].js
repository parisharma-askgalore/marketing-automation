export default async function handler(req, res) {
  try {
    const backendUrl = (process.env.BACKEND_URL || "https://marketing-automation-mkei.onrender.com/webhook").replace(/\/$/, "");

    // Build the upstream path from the catch-all segments
    const pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    const upstreamPath = pathSegments.join("/");

    // Forward query string (excluding the internal 'path' param)
    const query = { ...req.query };
    delete query.path;
    const qs = new URLSearchParams(query).toString();
    const targetUrl = `${backendUrl}/${upstreamPath}${qs ? `?${qs}` : ""}`;

    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method !== "GET" && req.method !== "DELETE") {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const text = await response.text();

    if (!response.ok) {
      console.error(`Backend error [${req.method} ${targetUrl}]:`, response.status, text);
      return res.status(response.status).json({
        error: "Backend returned an error",
        status: response.status,
        details: text.slice(0, 500),
      });
    }

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(200).send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
