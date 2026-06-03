import { useState, useRef, useEffect } from "react";
import WebLLMChatPanel from "../components/WebLLMChatPanel";

const API_BASE = import.meta.env.VITE_API_BASE || "https://script-auto.onrender.com";

// ── Icons ──────────────────────────────────────────────────────────────────────
function SpinnerIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
const SparklesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const LayersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const FontsList = ["Inter", "Outfit", "Playfair Display", "Roboto", "Montserrat", "Lora", "Courier New"];

// ── Collapsible Card ──────────────────────────────────────────────────────────
function Card({ title, icon, defaultOpen = true, headerExtra, children, noPad = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
      background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)",
      overflow: "hidden", marginBottom: 20
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 18px", background: "var(--bg-secondary)",
        borderBottom: open ? "1px solid var(--border-color)" : "none",
        userSelect: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {title}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {open && headerExtra}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1 }}
            title={open ? "Minimize" : "Expand"}
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ padding: noPad ? 0 : 20 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ImageGenerations() {
  const [globalPrompt, setGlobalPrompt] = useState(
    "Hyper-realistic professional advertising photography, commercial lighting, cinematic compositions, highly detailed 8k, photorealistic skin textures, natural gravitational cloth simulation, perfect anatomical correctness and human physics, flawless facial consistency, crisp edges, premium quality."
  );
  const [userPrompt, setUserPrompt] = useState("A hyper-realistic premium female mountaineer holding a steel thermos mug, sitting on Everest basecamp rocks, looking directly at the camera with extreme detail, background of massive snowy blue sky mountains.");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState("black-forest-labs/FLUX.1-schnell");
  const [generatingBg, setGeneratingBg] = useState(false);
  const [baseSceneImg, setBaseSceneImg] = useState(null);
  const [references, setReferences] = useState([]);
  const fileInputRef = useRef(null);
  const [userDirection, setUserDirection] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIframeUrl, setActiveIframeUrl] = useState("");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const [textLayers, setTextLayers] = useState([
    { id: 1, text: "Take", color: "#ffffff", font: "Outfit", size: 38 },
    { id: 2, text: "the climb.", color: "#2563eb", font: "Outfit", size: 38 },
    { id: 3, text: "Keep the", color: "#ffffff", font: "Outfit", size: 38 },
    { id: 4, text: "sales moving.", color: "#2563eb", font: "Outfit", size: 38 }
  ]);
  const [subTextLayer, setSubTextLayer] = useState({ text: "Zero Code 3D\nAI Sales Chatbot\nfor your business\nwebsite.", color: "#ffffff", font: "Outfit", size: 20 });
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [textX, setTextX] = useState(40);
  const [textY, setTextY] = useState(60);
  const [lineHeight] = useState(1.25);

  const selectedLayer = selectedLayerId === 'sub' ? subTextLayer : textLayers.find(l => l.id === selectedLayerId);
  const updateSelectedLayer = (field, val) => {
    if (selectedLayerId === 'sub') setSubTextLayer(prev => ({ ...prev, [field]: val }));
    else if (selectedLayerId) setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, [field]: val } : l));
  };
  const updateAllLayers = (field, val) => {
    setTextLayers(prev => prev.map(l => ({ ...l, [field]: val })));
    setSubTextLayer(prev => ({ ...prev, [field]: val }));
  };

  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);
  const [finalImage, setFinalImage] = useState(null);
  const [merging, setMerging] = useState(false);
  const [dragInfo, setDragInfo] = useState({ isDragging: false, startX: 0, startY: 0, initTextX: 0, initTextY: 0 });

  const handlePointerDown = (e) => { setDragInfo({ isDragging: true, startX: e.clientX, startY: e.clientY, initTextX: textX, initTextY: textY }); e.target.setPointerCapture(e.pointerId); };
  const handlePointerMove = (e) => { if (!dragInfo.isDragging) return; setTextX(dragInfo.initTextX + e.clientX - dragInfo.startX); setTextY(dragInfo.initTextY + e.clientY - dragInfo.startY); };
  const handlePointerUp = (e) => { if (dragInfo.isDragging) { setDragInfo(p => ({ ...p, isDragging: false })); e.target.releasePointerCapture(e.pointerId); } };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800&family=Roboto:wght@400;700&family=Montserrat:wght@400;700;900&family=Lora:wght@400;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleReferenceUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setReferences(prev => [...prev, { name: file.name, url: reader.result }]);
      reader.readAsDataURL(file);
    });
  };

  const handleOptimizePrompt = async () => {
    if (!userDirection.trim()) return;
    try {
      setIsOptimizing(true);
      const res = await fetch(`${API_BASE}/api/optimize-prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userDirection, globalPrompt, referencesCount: references.length }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (data.optimizedPrompt) setUserPrompt(data.optimizedPrompt);
    } catch (err) { alert("Error: " + err.message); }
    finally { setIsOptimizing(false); }
  };

  const handleSearchImages = (e) => { e.preventDefault(); if (searchQuery.trim()) setActiveIframeUrl(`https://www.pexels.com/search/${encodeURIComponent(searchQuery)}/`); };

  const handleGenerateBaseScene = async () => {
    try {
      setGeneratingBg(true);
      const res = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${userPrompt}. Style: ${globalPrompt}`,
          aspect_ratio: aspectRatio,
          model: selectedModel,
          references: references.map(r => r.url),
        })
      });
      if (!res.ok) throw new Error("Failed to generate.");
      const data = await res.json();
      if (data.status === "success") setBaseSceneImg(data.image);
    } catch (err) { alert("Error: " + err.message); }
    finally { setGeneratingBg(false); }
  };

  const drawTextOverlay = (ctx, w, h) => {
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    let y = textY;
    textLayers.filter(l => l.text.trim()).forEach(line => {
      ctx.font = `800 ${line.size}px "${line.font}", sans-serif`;
      ctx.fillStyle = line.color;
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      ctx.fillText(line.text, textX, y);
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      y += line.size * lineHeight;
    });
    if (textLayers.some(l => l.text.trim()) && subTextLayer.text.trim()) {
      y += 12; ctx.fillStyle = textLayers[1]?.color || "#2563eb"; ctx.fillRect(textX, y, 40, 3.5); y += 16;
    }
    if (subTextLayer.text.trim()) {
      ctx.font = `600 ${subTextLayer.size}px "${subTextLayer.font}", sans-serif`;
      ctx.fillStyle = subTextLayer.color;
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      subTextLayer.text.split("\n").forEach(line => { ctx.fillText(line, textX, y); y += subTextLayer.size * 1.3; });
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }
  };

  const drawCanvas = (isFinal = false) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 600, h = 600;
    if (aspectRatio === "9:16") { w = 450; h = 800; } else if (aspectRatio === "16:9") { w = 800; h = 450; }
    canvas.width = w; canvas.height = h;
    if (baseSceneImg) {
      const img = new Image(); img.src = baseSceneImg;
      img.onload = () => { ctx.drawImage(img, 0, 0, w, h); drawTextOverlay(ctx, w, h); if (isFinal) setFinalImage(canvas.toDataURL("image/png")); };
    } else {
      ctx.fillStyle = "#1e1e1e"; ctx.fillRect(0, 0, w, h);
      drawTextOverlay(ctx, w, h);
      if (isFinal) setFinalImage(canvas.toDataURL("image/png"));
    }
  };

  useEffect(() => { drawCanvas(); }, [baseSceneImg, aspectRatio, textLayers, subTextLayer, textX, textY, lineHeight]);

  const handleFinalMerge = () => { setMerging(true); setTimeout(() => { drawCanvas(true); setMerging(false); }, 800); };
  const handleDownload = () => { if (!finalImage) return; const a = document.createElement("a"); a.download = `creative_${Date.now()}.png`; a.href = finalImage; a.click(); };
  const handleDownloadText = () => {
    const canvas = textCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 600, h = 600;
    if (aspectRatio === "9:16") { w = 450; h = 800; } else if (aspectRatio === "16:9") { w = 800; h = 450; }
    canvas.width = w; canvas.height = h; ctx.clearRect(0, 0, w, h);
    drawTextOverlay(ctx, w, h);
    const a = document.createElement("a"); a.download = `typography_${Date.now()}.png`; a.href = canvas.toDataURL("image/png"); a.click();
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* ── SCROLLABLE MAIN ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px 80px 28px", minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Image Generations Workspace</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Click <strong>−</strong> on any card to minimize it · Scroll down for output panels</p>
        </div>

        {/* Pexels Search */}
        <Card title="Find Reference Images (Pexels)" icon="🔍">
          <form onSubmit={handleSearchImages} style={{ display: "flex", gap: 10, marginBottom: activeIframeUrl ? 14 : 0 }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Pexels…" style={{ ...inp, flex: 1, fontSize: "0.95rem", padding: "10px 14px" }} />
            <button type="submit" disabled={!searchQuery.trim()} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 28px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}>Search</button>
          </form>
          {activeIframeUrl && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Pexels Results</span>
                <a href={activeIframeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Open in new tab ↗</a>
              </div>
              <iframe src={activeIframeUrl} style={{ width: "100%", height: 380, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }} title="Pexels" />
            </div>
          )}
        </Card>

        {/* ── ROW 1: Global Prompts + References ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0 }}>
          <Card title="Global Style Prompts" icon={<SparklesIcon />}>
            <textarea
              value={globalPrompt}
              onChange={e => setGlobalPrompt(e.target.value)}
              style={{ ...inp, height: 120, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.82rem", lineHeight: 1.6 }}
            />
          </Card>

          <Card title="Reference Assets & Characters" icon="📁">
            <div onClick={() => fileInputRef.current?.click()}
              style={{ border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "22px", textAlign: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                Upload Character / Style References
                <span style={{ fontSize: "0.72rem", opacity: 0.65 }}>Maintains character consistency</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleReferenceUpload} />
            {references.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {references.map((ref, idx) => (
                  <div key={idx} style={{ position: "relative", width: 64, height: 64, borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                    <img src={ref.url} alt={ref.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => setReferences(p => p.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 16, height: 16, cursor: "pointer", color: "#fff", fontSize: "11px" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── ROW 2: Scene Generation + Typography ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0 }}>
          <Card title="Scene & Subject Generation (Base Layer)" icon={<SparklesIcon />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: 14, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <label style={lbl}>Quick Auto-Optimizer</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={userDirection} onChange={e => setUserDirection(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Describe your scene idea…" />
                  <button onClick={handleOptimizePrompt} disabled={isOptimizing || !userDirection.trim()} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 16px", fontWeight: 600, cursor: "pointer", opacity: isOptimizing ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                    {isOptimizing ? <SpinnerIcon /> : <SparklesIcon />} Optimize
                  </button>
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 6 }}>Auto-generates an optimized prompt considering global directives.</p>
              </div>
              <div>
                <label style={lbl}>Subject & Scene Prompt</label>
                <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} style={{ ...inp, height: 130, resize: "vertical", lineHeight: 1.55 }} placeholder="Describe your primary character, clothing, pose, setting…" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Aspect Ratio</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={sel}>
                    <option value="1:1">1:1 Square</option>
                    <option value="9:16">9:16 Vertical Reel</option>
                    <option value="16:9">16:9 Landscape</option>
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Hugging Face Model</label>
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={sel}>
                    {HUGGINGFACE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleGenerateBaseScene} disabled={generatingBg || !userPrompt.trim()}

                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: generatingBg ? "var(--bg-tertiary)" : "var(--accent)", color: generatingBg ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "11px 0", fontWeight: 700, cursor: generatingBg ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                {generatingBg ? <><SpinnerIcon /> Generating…</> : <><SparklesIcon /> Generate Scene</>}
              </button>
            </div>
          </Card>

          <Card title="Typography Wall Settings (Overlay)" icon="T">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {textLayers.map(layer => (
                  <div key={layer.id}>
                    <label style={lbl}>Headline Line {layer.id}</label>
                    <input value={layer.text} onChange={e => setTextLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: e.target.value } : l))} style={inp} />
                  </div>
                ))}
              </div>
              <div>
                <label style={lbl}>Sub-headline</label>
                <textarea value={subTextLayer.text} onChange={e => setSubTextLayer(p => ({ ...p, text: e.target.value }))} style={{ ...inp, height: 70, resize: "vertical", lineHeight: 1.4 }} />
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{selectedLayerId === null ? "Global Styling" : selectedLayerId === "sub" ? "Sub-headline" : `Line ${selectedLayerId}`}</span>
                  {selectedLayerId !== null && <button onClick={() => setSelectedLayerId(null)} style={{ background: "none", border: "1px solid var(--border-color)", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: "0.72rem" }}>Clear</button>}
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}>
                    <label style={lbl}>Font</label>
                    <select value={selectedLayerId === null ? textLayers[0].font : selectedLayer?.font || textLayers[0].font} onChange={e => { const v = e.target.value; selectedLayerId === null ? updateAllLayers("font", v) : updateSelectedLayer("font", v); }} style={sel}>
                      {FontsList.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Size</label>
                    <input type="number" value={selectedLayerId === null ? textLayers[0].size : selectedLayer?.size || 30} onChange={e => { const v = parseInt(e.target.value) || 20; selectedLayerId === null ? updateAllLayers("size", v) : updateSelectedLayer("size", v); }} style={inp} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Color</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input type="color" value={selectedLayerId === null ? textLayers[0].color : selectedLayer?.color || "#fff"} onChange={e => { const v = e.target.value; selectedLayerId === null ? updateAllLayers("color", v) : updateSelectedLayer("color", v); }} style={{ width: 36, height: 36, border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                      <input value={selectedLayerId === null ? textLayers[0].color : selectedLayer?.color || "#fff"} onChange={e => { const v = e.target.value; selectedLayerId === null ? updateAllLayers("color", v) : updateSelectedLayer("color", v); }} style={{ ...inp, flex: 1, padding: "8px 10px" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>X pos</label>
                    <input type="number" value={textX} onChange={e => setTextX(parseInt(e.target.value) || 0)} style={inp} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Y pos</label>
                    <input type="number" value={textY} onChange={e => setTextY(parseInt(e.target.value) || 0)} style={inp} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── OUTPUT DIVIDER ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "12px 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>↓ Output Panels — Scroll to view</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
        </div>

        {/* ── ROW 3: Base Output + Text PNG ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0 }}>
          <Card title="Layer 2: Generated Scene (Hugging Face API)" icon="🖼️">
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", minHeight: 280 }}>
              {baseSceneImg ? (
                <img src={baseSceneImg} alt="Base Scene" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" style={{ marginBottom: 10, opacity: 0.4 }}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <p style={{ fontSize: "0.82rem", fontWeight: 500 }}>No scene generated yet.</p>
                  <p style={{ fontSize: "0.72rem", marginTop: 4, opacity: 0.7 }}>Configure prompts above and click Generate Scene.</p>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Layer 1: Text Wall (Transparent PNG)"
            icon="🔤"
            headerExtra={<button onClick={handleDownloadText} style={{ fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><DownloadIcon /> Text PNG</button>}
            noPad
          >
            <div style={{ position: "relative", background: "#f0f0f1", backgroundImage: "radial-gradient(#dbdbdb 1px, transparent 0), radial-gradient(#dbdbdb 1px, transparent 0)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px", minHeight: 280, overflow: "hidden", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
              <canvas ref={textCanvasRef} style={{ display: "none" }} />
              <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
                style={{ position: "absolute", left: 0, top: 0, transform: `translate(${textX}px, ${textY}px)`, cursor: dragInfo.isDragging ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}>
                <div style={{ fontWeight: 900, lineHeight: 1.25 }}>
                  {textLayers.map(layer => layer.text && <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ color: layer.color, fontFamily: `"${layer.font}", sans-serif`, fontSize: layer.size * 0.7, cursor: "pointer", border: selectedLayerId === layer.id ? "1px dashed #666" : "1px solid transparent", padding: 2, margin: -2 }}>{layer.text}</div>)}
                </div>
                {subTextLayer.text && <div onClick={() => setSelectedLayerId('sub')} style={{ color: subTextLayer.color, fontFamily: `"${subTextLayer.font}", sans-serif`, fontSize: subTextLayer.size * 0.8, fontWeight: 600, opacity: 0.9, whiteSpace: "pre-line", lineHeight: 1.3, cursor: "pointer", border: selectedLayerId === 'sub' ? "1px dashed #666" : "1px solid transparent", padding: 2, margin: -2, marginTop: 14 }}>{subTextLayer.text}</div>}
              </div>
            </div>
          </Card>
        </div>

        {/* ── ROW 4: Final Merger ── */}
        <Card
          title="Layer 3: Canvas Merger & Final Ad Composition"
          icon={<LayersIcon />}
          headerExtra={
            <button onClick={handleFinalMerge} style={{ fontSize: "0.82rem", fontWeight: 700, padding: "5px 14px", borderRadius: "var(--radius-sm)", background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {merging ? <><SpinnerIcon /> Compiling…</> : <><LayersIcon /> Compile Merger</>}
            </button>
          }
        >
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {finalImage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", justifyContent: "center", background: "var(--bg-tertiary)" }}>
                <img src={finalImage} alt="Final Ad" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
              </div>
              <button onClick={handleDownload} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#10b981", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
                <DownloadIcon /> Download High-Res Ad Creative
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 0" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>Merger not compiled yet.</p>
              <p style={{ fontSize: "0.75rem", marginTop: 4, opacity: 0.7 }}>Click "Compile Merger" in the card header above.</p>
            </div>
          )}
        </Card>

      </main>

      {/* ── CHAT PANEL ── */}
      <aside style={{ width: isChatCollapsed ? "52px" : "380px", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", height: "100vh", flexShrink: 0, borderLeft: "1px solid var(--border-color)", background: "var(--bg-primary)", overflow: "hidden" }}>
        <WebLLMChatPanel isCollapsed={isChatCollapsed} onToggleCollapse={() => setIsChatCollapsed(c => !c)} />
      </aside>
    </div>
  );
}

// ── Hugging Face inference models ─────────────────────────────────────────
const HUGGINGFACE_MODELS = [
  { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell (Fast & Free)" }
];

// ── Style tokens ───────────────────────────────────────────────────────────────
const lbl = { display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 5, fontFamily: "var(--font-mono)" };
const inp = { width: "100%", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: "0.875rem", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-primary)", boxSizing: "border-box" };
const sel = { width: "100%", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "9.5px 12px", fontSize: "0.875rem", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-primary)", cursor: "pointer", boxSizing: "border-box" };
