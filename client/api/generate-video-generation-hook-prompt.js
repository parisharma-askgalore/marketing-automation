export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://marketing-automation-mkei.onrender.com/webhook/generate-video-generation-hook-prompt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("n8n error for generate-video-generation-hook-prompt:", response.status, text);
      return res.status(502).json({
        error: "n8n returned an error",
        status: response.status,
        details: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("generate-video-generation-hook-prompt error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
