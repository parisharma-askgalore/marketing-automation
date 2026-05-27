import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await fetch(
    "https://marketing-automation-mkei.onrender.com/webhook/get-projects",
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  const data = await response.json();
  res.json(data);
}
