export default async function handler(req, res) {
  try {
    const { userDirection, globalPrompt, referencesCount } = req.body;

    if (!userDirection) {
      return res.status(400).json({ error: "userDirection is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCSsgJlLSWBK7lcrZFvIavrh6xtiLSWGF0";

    const prompt = `You are an expert AI image generation prompt engineer.

User Direction:
${userDirection}

Global Prompt Aspects to factor in:
${globalPrompt || ""}

Number of reference images provided by the user: ${referencesCount || 0}

Task: Write a highly optimized prompt for a high-end AI image generation model.
- Describe the scene clearly based on the user's direction.
- Seamlessly incorporate the style, physics, and constraints from the Global Prompt.
- If reference images are provided (${referencesCount || 0}), note that subject/asset references are attached.
- Output ONLY the final prompt text, nothing else.

Return output matching this JSON schema exactly:
{
  "optimizedPrompt": "string"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return res.status(502).json({ error: `Gemini API error ${geminiRes.status}`, details: errText.slice(0, 400) });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let optimizedPrompt = "";
    try {
      const parsed = JSON.parse(rawText);
      optimizedPrompt = parsed.optimizedPrompt || rawText;
    } catch {
      optimizedPrompt = rawText;
    }

    res.status(200).json({ optimizedPrompt });
  } catch (err) {
    console.error("optimize-prompt error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
