export default async function handler(req, res) {
  
  try {
    const backendUrl = (process.env.BACKEND_URL || "https://marketing-automation-mkei.onrender.com/webhook").replace(/\/$/, "");
    const response = await fetch(
      `${backendUrl}/get-projects`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("n8n error for get-projects:", response.status, text);
      return res.status(502).json({
        error: "n8n returned an error",
        status: response.status,
        details: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("get-projects error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
