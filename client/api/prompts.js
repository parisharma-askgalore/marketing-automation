export default async function handler(req, res) {
  try {
    const backendUrl = (process.env.BACKEND_URL || "https://marketing-automation-mkei.onrender.com/webhook").replace(/\/$/, "");
    // Check if backend URL ends with /api, if so remove it to attach /api/prompts correctly if needed,
    // actually backend expects /api/prompts. 
    // Wait, the previous scripts did `${backendUrl}/generate-hooks`, and the FastAPI backend expects `/api/generate-hooks`.
    // So `BACKEND_URL` in Vercel is likely set to `https://script-auto.onrender.com/api`.
    // So `${backendUrl}/prompts` becomes `https://script-auto.onrender.com/api/prompts`.
    
    // For GET request we do not stringify body
    const isPost = req.method === "POST";
    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    };
    if (isPost) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(
      `${backendUrl}/prompts`,
      options
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("Backend error for prompts:", response.status, text);
      return res.status(502).json({
        error: "Backend returned an error",
        status: response.status,
        details: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("prompts error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
