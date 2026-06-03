export default async function handler(req, res) {
  try {
    const backendUrl = (process.env.BACKEND_URL || "https://marketing-automation-mkei.onrender.com/webhook").replace(/\/$/, "");

    // Extract the project_id from the URL path: /api/delete-project/[id]
    const parts = req.url.split("/");
    const projectId = parts[parts.length - 1].split("?")[0];

    const response = await fetch(
      `${backendUrl}/delete-project/${projectId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("Backend error for delete-project:", response.status, text);
      return res.status(502).json({
        error: "Backend returned an error",
        status: response.status,
        details: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("delete-project error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
