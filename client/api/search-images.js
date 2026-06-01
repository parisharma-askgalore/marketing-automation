export default async function handler(req, res) {
  try {
    const { query, limit } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    const maxResults = limit || 12;

    // Use Wikimedia Commons API - free, no key needed
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${maxResults}&prop=imageinfo&iiprop=url|thumburl|extmetadata&iiurlwidth=400&origin=*`;

    const wikRes = await fetch(url, {
      headers: { "User-Agent": "MarketingAutomationBot/1.0" }
    });

    if (!wikRes.ok) throw new Error(`Wikimedia returned ${wikRes.status}`);

    const wikData = await wikRes.json();
    const pages = wikData?.query?.pages ? Object.values(wikData.query.pages) : [];

    const results = pages
      .map(page => {
        const info = page.imageinfo?.[0];
        if (!info?.url) return null;
        const title = page.title?.replace("File:", "") || "";
        return {
          title,
          image: info.url,
          thumbnail: info.thumburl || info.url,
          url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || "")}`,
          source: "Wikimedia Commons"
        };
      })
      .filter(Boolean);

    res.status(200).json({ images: results });
  } catch (err) {
    console.error("search-images error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
