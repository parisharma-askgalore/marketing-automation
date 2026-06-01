export default async function handler(req, res) {
  try {
    const backendUrl = (process.env.BACKEND_URL || "https://marketing-automation-mkei.onrender.com/webhook").replace(/\/$/, "");
    const response = await fetch(
      `${backendUrl}/search-images`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("Backend error for search-images:", response.status, text);
      return res.status(502).json({
        error: "Backend returned an error",
        status: response.status,
        details: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("search-images error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
