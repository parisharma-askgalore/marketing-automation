export default async function handler(req, res) {
  try {
    const { query, limit } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const maxResults = limit || 12;
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=prefixsearch&redirects=1&formatversion=2&piprop=original|thumbnail&pithumbsize=600&pilimit=${maxResults}&gpssearch=${encodeURIComponent(query)}&gpslimit=${maxResults}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ImageSearchBot/1.0 (https://marketing-automation.vercel.app)"
      }
    });

    if (!response.ok) {
      throw new Error(`Wikimedia API returned ${response.status}`);
    }

    const data = await response.json();
    const pages = data?.query?.pages || [];
    
    const results = [];
    for (const page of pages) {
      const thumbnail = page.thumbnail?.source;
      const original = page.original?.source;
      
      if (thumbnail || original) {
        results.push({
          title: page.title || "",

          image: original || thumbnail,
          thumbnail: thumbnail || original,
          url: `https://en.wikipedia.org/?curid=${page.pageid}`,
          source: "Wikimedia"
        });
      }
    }

    res.status(200).json({ images: results });
  } catch (err) {
    console.error("search-images error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
