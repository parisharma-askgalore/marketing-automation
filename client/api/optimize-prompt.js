export default async function handler(req, res) {
  try {
    const { userDirection, globalPrompt, referencesCount } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing on Vercel." });
    }

    const prompt = `You are an expert AI image generation prompt engineer.
    
User Direction:
${userDirection}

Global Prompt Aspects to factor in:
${globalPrompt}

Number of reference images provided by the user: ${referencesCount}

Task: Write a highly optimized prompt for a high-end AI image generation model. 
- The prompt should describe the scene clearly based on the user's direction.
- It MUST seamlessly incorporate the style, physics, and constraints from the Global Prompt.
- If reference images are provided (${referencesCount}), implicitly suggest referencing the specific subject/assets in those images.
- DO NOT include extra conversational text, just the final prompt.

Return output matching this JSON schema exactly:
{
  "optimizedPrompt": "string"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ error: "Gemini API returned an error", details: errText });
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(textResponse);

    res.status(200).json({ optimizedPrompt: parsed.optimizedPrompt || textResponse });
  } catch (err) {
    console.error("optimize-prompt error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
