import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://script-auto.onrender.com";

// ── Icons ──────────────────────────────────────────────────────────────────────
function SpinnerIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Source badge ───────────────────────────────────────────────────────────────
const SOURCE_META = {
  generated:     { label: "Generated",      color: "#7c3aed" },
  reference:     { label: "Reference",      color: "#0891b2" },
  project_input: { label: "Project Input",  color: "#059669" },
  media_review:  { label: "Media Review",   color: "#d97706" },
};

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { label: source, color: "#6b7280" };
  return (
    <span style={{
      fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 4,
      background: meta.color + "22", color: meta.color,
      fontFamily: "var(--font-mono)",
    }}>
      {meta.label}
    </span>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8, padding: 8, cursor: "pointer", color: "#fff", display: "flex",
        }}
      ><CloseIcon /></button>
      <img
        src={image.url}
        alt={image.prompt || "Image"}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
      />
      {/* Meta panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          padding: "12px 20px", maxWidth: "min(600px, 90vw)",
          color: "#fff", fontSize: "0.8rem", lineHeight: 1.5,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <SourceBadge source={image.source} />
          {image.model && (
            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>
              {image.model}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
            {new Date(image.created_at).toLocaleString()}
          </span>
        </div>
        {image.prompt && (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", marginTop: 4 }}>
            {image.prompt.slice(0, 240)}{image.prompt.length > 240 ? "…" : ""}
          </div>
        )}
        <a
          href={image.url} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, color: "#a78bfa", fontSize: "0.72rem", textDecoration: "none" }}
        >
          <ExternalLinkIcon /> Open full size
        </a>
      </div>
    </div>
  );
}

// ── Image card ─────────────────────────────────────────────────────────────────
function ImageCard({ image, onDelete, onClick }) {
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm("Remove this image from history?")) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/image-history/${image.id}`, { method: "DELETE" });
      onDelete(image.id);
    } catch (err) {
      alert("Delete failed: " + err.message);
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onClick(image)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        border: `1px solid ${hovered ? "var(--border-hover)" : "var(--border-color)"}`,
        background: "var(--bg-secondary)", cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        position: "relative",
      }}
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio: "1/1", overflow: "hidden", background: "var(--bg-tertiary)" }}>
        <img
          src={image.url}
          alt={image.prompt || "Image"}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <SourceBadge source={image.source} />
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
            {new Date(image.created_at).toLocaleDateString()}
          </span>
        </div>
        {image.prompt && (
          <p style={{
            fontSize: "0.72rem", color: "var(--text-secondary)", margin: "5px 0 0",
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            lineHeight: 1.4,
          }}>
            {image.prompt}
          </p>
        )}
      </div>

      {/* Delete button (shows on hover) */}
      {hovered && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 6,
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
          }}
          title="Delete"
        >
          {deleting ? <SpinnerIcon size={12} /> : <TrashIcon />}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ImageHistory() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`${API_BASE}/api/image-history?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

  const counts = images.reduce((acc, img) => {
    acc[img.source] = (acc[img.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ height: "100%", overflow: "auto", background: "var(--bg-primary)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)",
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Image History
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {images.length} image{images.length !== 1 ? "s" : ""} across all sources
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
            cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem",
          }}
        >
          {loading ? <SpinnerIcon /> : <RefreshIcon />} Refresh
        </button>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {["all", "generated", "reference", "project_input", "media_review"].map((src) => {
            const isActive = sourceFilter === src;
            const meta = SOURCE_META[src] || { label: "All", color: "var(--accent)" };
            const count = src === "all" ? images.length : (counts[src] || 0);
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                style={{
                  padding: "5px 12px", borderRadius: 20,
                  border: `1px solid ${isActive ? meta.color : "var(--border-color)"}`,
                  background: isActive ? meta.color + "20" : "var(--bg-secondary)",
                  color: isActive ? meta.color : "var(--text-secondary)",
                  cursor: "pointer", fontSize: "0.78rem", fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {src === "all" ? "All" : (SOURCE_META[src]?.label || src)}
                {count > 0 && (
                  <span style={{
                    marginLeft: 5, fontSize: "0.65rem",
                    background: isActive ? meta.color + "30" : "var(--bg-tertiary)",
                    padding: "1px 5px", borderRadius: 8,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <SpinnerIcon size={24} />
            <p style={{ marginTop: 12, fontSize: "0.85rem" }}>Loading image history…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: "20px 24px", borderRadius: "var(--radius-lg)",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontSize: "0.85rem",
          }}>
            Failed to load: {error}
            <button onClick={fetchHistory} style={{ marginLeft: 12, cursor: "pointer", color: "#ef4444", background: "none", border: "none", textDecoration: "underline" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" style={{ opacity: 0.3, marginBottom: 12 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>No images saved yet.</p>
            <p style={{ fontSize: "0.78rem", marginTop: 6, opacity: 0.7 }}>
              Generate images, attach references, or run a media review to see them here.
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && images.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}>
            {images.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onDelete={handleDelete}
                onClick={setLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
