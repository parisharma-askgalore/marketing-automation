import { useState, useRef, useEffect, useMemo } from "react";
import WebLLMChatPanel from "../components/WebLLMChatPanel";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const LayersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const FontsList = ["Inter", "Outfit", "Playfair Display", "Roboto", "Montserrat", "Lora", "Courier New"];

// ── Reusable Card Component ───────────────────────────────────────────────────
const CardWrapper = ({ id, title, icon, isExpanded, onToggle, children, contentStyle, headerExtra }) => {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", width: "100%",
      borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
      background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px",
        borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", 
        cursor: "move", userSelect: "none"
      }} className="drag-handle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {title}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {headerExtra}
          <button 
            onClick={onToggle}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: 600, padding: "0 4px" }}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20, ...contentStyle }}>
          {children}
        </div>
      )}
    </div>
  );
};


export default function ImageGenerations() {
  // Preloaded Global Prompt
  const [globalPrompt, setGlobalPrompt] = useState(
    "Hyper-realistic professional advertising photography, commercial lighting, cinematic compositions, highly detailed 8k, photorealistic skin textures, natural gravitational cloth simulation, perfect anatomical correctness and human physics, flawless facial consistency, crisp edges, premium quality."
  );

  // Inputs
  const [userPrompt, setUserPrompt] = useState("A hyper-realistic premium female mountaineer holding a steel thermos mug, sitting on Everest basecamp rocks, looking directly at the camera with extreme detail, background of massive snowy blue sky mountains.");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [generatingBg, setGeneratingBg] = useState(false);
  const [baseSceneImg, setBaseSceneImg] = useState(null); 
  
  // Reference Images State
  const [references, setReferences] = useState([]);
  const fileInputRef = useRef(null);

  // Optimization State
  const [userDirection, setUserDirection] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Image Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIframeUrl, setActiveIframeUrl] = useState("");
  
  // Layout State
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Grid / Card Layout State
  const defaultHeights = { global: 4, references: 7, scene: 9, layer2: 8, typography: 13, layer1: 12, layer3: 11 };
  const [expandedCards, setExpandedCards] = useState({
    global: true, references: true, scene: true, typography: true, layer1: true, layer2: true, layer3: true
  });
  
  const defaultLayout = [
    { i: 'global', x: 0, y: 0, w: 6, h: defaultHeights.global },
    { i: 'references', x: 6, y: 0, w: 6, h: defaultHeights.references },
    { i: 'scene', x: 0, y: defaultHeights.global, w: 6, h: defaultHeights.scene },
    { i: 'layer2', x: 6, y: defaultHeights.references, w: 6, h: defaultHeights.layer2 },
    { i: 'typography', x: 0, y: defaultHeights.global + defaultHeights.scene, w: 6, h: defaultHeights.typography },
    { i: 'layer1', x: 6, y: defaultHeights.references + defaultHeights.layer2, w: 6, h: defaultHeights.layer1 },
    { i: 'layer3', x: 0, y: 30, w: 12, h: defaultHeights.layer3 },
  ];

  const [layouts, setLayouts] = useState({ lg: defaultLayout });

  const toggleCard = (id) => {
    const isExpanding = !expandedCards[id];
    setExpandedCards(prev => ({ ...prev, [id]: isExpanding }));

    // Adjust height in layout automatically
    setLayouts(prev => {
      const currentLg = prev.lg || defaultLayout;
      const newLg = currentLg.map(item => {
        if (item.i === id) {
          return { ...item, h: isExpanding ? defaultHeights[id] : 1 };
        }
        return item;
      });
      return { ...prev, lg: newLg };
    });
  };

  const onLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
  };

  // Text Layer State
  const [textLayers, setTextLayers] = useState([
    { id: 1, text: "Take", color: "#ffffff", font: "Outfit", size: 38 },
    { id: 2, text: "the climb.", color: "#2563eb", font: "Outfit", size: 38 },
    { id: 3, text: "Keep the", color: "#ffffff", font: "Outfit", size: 38 },
    { id: 4, text: "sales moving.", color: "#2563eb", font: "Outfit", size: 38 }
  ]);
  const [subTextLayer, setSubTextLayer] = useState({
    text: "Zero Code 3D\nAI Sales Chatbot\nfor your business\nwebsite.",
    color: "#ffffff", font: "Outfit", size: 20
  });
  
  const [selectedLayerId, setSelectedLayerId] = useState(null); 

  const [textX, setTextX] = useState(40);
  const [textY, setTextY] = useState(60);
  const [lineHeight, setLineHeight] = useState(1.25);

  const selectedLayer = selectedLayerId === 'sub' ? subTextLayer : textLayers.find(l => l.id === selectedLayerId);
  const updateSelectedLayer = (field, val) => {
    if (selectedLayerId === 'sub') {
      setSubTextLayer(prev => ({ ...prev, [field]: val }));
    } else if (selectedLayerId) {
      setTextLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, [field]: val } : l));
    }
  };
  const updateAllLayers = (field, val) => {
    setTextLayers(prev => prev.map(l => ({ ...l, [field]: val })));
    setSubTextLayer(prev => ({ ...prev, [field]: val }));
  };

  // Merge & Canvas State
  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);
  const [finalImage, setFinalImage] = useState(null);
  const [merging, setMerging] = useState(false);

  // Drag State for Text
  const [dragInfo, setDragInfo] = useState({ isDragging: false, startX: 0, startY: 0, initTextX: 0, initTextY: 0 });

  const handlePointerDown = (e) => {
    setDragInfo({ isDragging: true, startX: e.clientX, startY: e.clientY, initTextX: textX, initTextY: textY });
    e.target.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragInfo.isDragging) return;
    const dx = e.clientX - dragInfo.startX;
    const dy = e.clientY - dragInfo.startY;
    setTextX(dragInfo.initTextX + dx);
    setTextY(dragInfo.initTextY + dy);
  };
  const handlePointerUp = (e) => {
    if (dragInfo.isDragging) {
      setDragInfo(prev => ({ ...prev, isDragging: false }));
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=Roboto:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleReferenceUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { setReferences(prev => [...prev, { name: file.name, url: reader.result }]); };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (index) => { setReferences(prev => prev.filter((_, i) => i !== index)); };

  const handleOptimizePrompt = async () => {
    if (!userDirection.trim()) return;
    try {
      setIsOptimizing(true);
      const response = await fetch("/api/optimize-prompt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userDirection, globalPrompt, referencesCount: references.length })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.details || `HTTP ${response.status}`);
      if (data.optimizedPrompt) setUserPrompt(data.optimizedPrompt);
    } catch (error) {
      alert("Optimize Prompt Error: " + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSearchImages = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveIframeUrl(`https://www.pexels.com/search/${encodeURIComponent(searchQuery)}/`);
  };

  const handleGenerateBaseScene = async () => {
    try {
      setGeneratingBg(true);
      const finalPrompt = `${userPrompt}. Instructions for style and physics: ${globalPrompt}`;
      const response = await fetch("/api/generate-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, aspect_ratio: aspectRatio })
      });
      if (!response.ok) throw new Error("Failed to generate image base scene.");
      const data = await response.json();
      if (data.status === "success") setBaseSceneImg(data.image);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setGeneratingBg(false);
    }
  };

  const drawCanvas = (isFinal = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 600, height = 600;
    if (aspectRatio === "9:16") { width = 450; height = 800; }
    else if (aspectRatio === "16:9") { width = 800; height = 450; }

    canvas.width = width;
    canvas.height = height;

    if (baseSceneImg) {
      const img = new Image();
      img.src = baseSceneImg;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawTextOverlay(ctx, width, height);
        if (isFinal) setFinalImage(canvas.toDataURL("image/png"));
      };
    } else {
      ctx.fillStyle = "#1e1e1e"; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff"; ctx.font = "14px Inter"; ctx.textAlign = "center";
      ctx.fillText("Base Scene Layer Placeholder", width / 2, height / 2);
      drawTextOverlay(ctx, width, height);
    }
  };

  const drawTextOverlay = (ctx, w, h) => {
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    let currentY = textY;
    
    textLayers.filter(l => l.text.trim() !== "").forEach(line => {
      ctx.font = `800 ${line.size}px "${line.font}", sans-serif`;
      ctx.fillStyle = line.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      ctx.fillText(line.text, textX, currentY);
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      currentY += line.size * lineHeight;
    });

    if (textLayers.some(l => l.text.trim() !== "") && subTextLayer.text.trim() !== "") {
      currentY += 12;
      ctx.fillStyle = textLayers[1]?.color || "#2563eb";
      ctx.fillRect(textX, currentY, 40, 3.5);
      currentY += 16;
    }

    if (subTextLayer.text.trim() !== "") {
      ctx.font = `600 ${subTextLayer.size}px "${subTextLayer.font}", sans-serif`;
      ctx.fillStyle = subTextLayer.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowBlur = 4; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      const subLines = subTextLayer.text.split("\n");
      subLines.forEach(subLine => {
        ctx.fillText(subLine, textX, currentY);
        currentY += subTextLayer.size * 1.3;
      });
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }
  };

  useEffect(() => { drawCanvas(); }, [baseSceneImg, aspectRatio, textLayers, subTextLayer, textX, textY, lineHeight]);

  const handleFinalMerge = async () => {
    setMerging(true);
    setTimeout(() => { drawCanvas(true); setMerging(false); }, 800);
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement("a");
    link.download = `creative_generation_${Date.now()}.png`; link.href = finalImage; link.click();
  };

  const handleDownloadText = () => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 600, height = 600;
    if (aspectRatio === "9:16") { width = 450; height = 800; }
    else if (aspectRatio === "16:9") { width = 800; height = 450; }
    canvas.width = width; canvas.height = height; ctx.clearRect(0, 0, width, height); 
    drawTextOverlay(ctx, width, height);
    const link = document.createElement("a"); link.download = `typography_overlay_${Date.now()}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  };

  return (
    <main style={{ maxWidth: "var(--max-width, 1600px)", margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Title Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Image Generations Workspace</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Drag and drop cards to customize your layout. Expand or minimize panels to save space.
          </p>
        </div>
      </div>

      {/* Solo Pexels Image Search */}
      <div style={{ marginBottom: 32, background: "var(--bg-tertiary)", padding: 20, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 12, color: "var(--text-primary)" }}>Find Reference Images (Pexels)</h3>
        <form onSubmit={handleSearchImages} style={{ display: "flex", gap: 12, marginBottom: activeIframeUrl ? 16 : 0 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Pexels for references..."
            style={{ ...inputStyle, flex: 1, padding: "12px 16px", fontSize: "1rem" }}
          />
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            style={{
              background: "var(--accent)", color: "#fff", border: "none", 
              borderRadius: "var(--radius-md)", padding: "0 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            Search
          </button>
        </form>
        {activeIframeUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Search Results</span>
              <a href={activeIframeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Open in New Tab ↗</a>
            </div>
            <iframe 
              src={activeIframeUrl} 
              style={{ width: "100%", height: 400, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
              title="Pexels Image Search"
            />
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA WITH CHAT */}
      <div style={{ display: "flex", gap: 32, alignItems: "stretch", minHeight: "calc(100vh - 200px)" }} className="fade-in">
        
        {/* MAIN WORKSPACE WRAPPER (Shrinks when chat opens) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveGridLayout 
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={40}
            onLayoutChange={onLayoutChange}
            draggableHandle=".drag-handle"
            margin={[24, 24]}
          >
            {/* Global Prompts */}
            <div key="global">
              <CardWrapper 
                id="global" title="Global Prompts" icon={<SparklesIcon />}
                isExpanded={expandedCards.global} onToggle={() => toggleCard("global")}
              >
                <textarea
                  value={globalPrompt} onChange={(e) => setGlobalPrompt(e.target.value)}
                  style={{ width: "100%", height: "100%", minHeight: 80, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: "0.85rem", color: "var(--text-primary)", background: "var(--bg-secondary)", resize: "none", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}
                />
              </CardWrapper>
            </div>

            {/* References */}
            <div key="references">
              <CardWrapper 
                id="references" title="Reference Assets & Characters" icon={<span style={{fontSize:'12px'}}>📁</span>}
                isExpanded={expandedCards.references} onToggle={() => toggleCard("references")}
              >
                <div onClick={() => fileInputRef.current?.click()} style={{ border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "20px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    <span>Upload References</span>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleReferenceUpload} />
                {references.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                    {references.map((ref, idx) => (
                      <div key={idx} style={{ position: "relative", width: 64, height: 64, borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                        <img src={ref.url} alt={ref.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => removeReference(idx)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </CardWrapper>
            </div>

            {/* Scene Generation Setup */}
            <div key="scene">
              <CardWrapper 
                id="scene" title="Scene Generation Setup" icon={<SparklesIcon />}
                isExpanded={expandedCards.scene} onToggle={() => toggleCard("scene")}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <label style={labelStyle}>Quick Auto-Optimizer</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input value={userDirection} onChange={(e) => setUserDirection(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={handleOptimizePrompt} disabled={isOptimizing || !userDirection.trim()} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 16px", fontWeight: 600, cursor: "pointer", opacity: isOptimizing ? 0.7 : 1 }}>Optimize</button>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Subject & Scene Prompt</label>
                    <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} style={{ width: "100%", height: 70, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px", fontSize: "0.875rem", fontFamily: "inherit", resize: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Aspect Ratio</label>
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={selectStyle}>
                        <option value="1:1">1:1 Square</option>
                        <option value="9:16">9:16 Vertical Reel</option>
                        <option value="16:9">16:9 Landscape</option>
                      </select>
                    </div>
                    <button onClick={handleGenerateBaseScene} disabled={generatingBg || !userPrompt.trim()} style={{ flex: 1, background: generatingBg ? "var(--bg-tertiary)" : "var(--accent)", color: generatingBg ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer" }}>
                      {generatingBg ? "Generating..." : "Generate Scene"}
                    </button>
                  </div>
                </div>
              </CardWrapper>
            </div>

            {/* Layer 2: Generated Character Base */}
            <div key="layer2">
              <CardWrapper 
                id="layer2" title="Layer 2: Base Output" icon={<span style={{fontSize:'12px'}}>🖼️</span>}
                isExpanded={expandedCards.layer2} onToggle={() => toggleCard("layer2")}
                contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-tertiary)" }}
              >
                {baseSceneImg ? (
                  <img src={baseSceneImg} alt="Base" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-muted)" }}><p style={{ fontSize: "0.85rem", fontWeight: 500 }}>No base scene generated.</p></div>
                )}
              </CardWrapper>
            </div>

            {/* Typography Overlay Settings */}
            <div key="typography">
              <CardWrapper 
                id="typography" title="Typography Wall Settings" icon={<span style={{fontSize:'12px'}}>T</span>}
                isExpanded={expandedCards.typography} onToggle={() => toggleCard("typography")}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {textLayers.map((layer) => (
                      <div key={layer.id}>
                        <label style={labelStyle}>Line {layer.id}</label>
                        <input value={layer.text} onChange={(e) => setTextLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: e.target.value } : l))} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={labelStyle}>Sub-headline</label>
                    <textarea value={subTextLayer.text} onChange={(e) => setSubTextLayer(prev => ({ ...prev, text: e.target.value }))} style={{ width: "100%", height: 50, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px", fontSize: "0.875rem", fontFamily: "inherit", resize: "none" }} />
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{selectedLayerId === null ? "Global Styling" : `Styling Selection`}</span>
                      {selectedLayerId !== null && <button onClick={() => setSelectedLayerId(null)} style={{ background: "none", border: "1px solid var(--border-color)", cursor: "pointer", borderRadius: 4, padding: "2px 6px" }}>Clear</button>}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ flex: 1 }}><label style={labelStyle}>Font</label><select value={selectedLayerId === null ? textLayers[0].font : selectedLayer.font} onChange={(e) => { const val = e.target.value; if (selectedLayerId === null) updateAllLayers("font", val); else updateSelectedLayer("font", val); }} style={selectStyle}>{FontsList.map(font => <option key={font} value={font}>{font}</option>)}</select></div>
                      <div style={{ flex: 1 }}><label style={labelStyle}>Color</label><input type="color" value={selectedLayerId === null ? textLayers[0].color : selectedLayer.color} onChange={(e) => { const val = e.target.value; if (selectedLayerId === null) updateAllLayers("color", val); else updateSelectedLayer("color", val); }} style={{ width: "100%", height: 38, border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer" }} /></div>
                      <div style={{ flex: 1 }}><label style={labelStyle}>Size</label><input type="number" value={selectedLayerId === null ? textLayers[0].size : selectedLayer.size} onChange={(e) => { const val = parseInt(e.target.value) || 20; if (selectedLayerId === null) updateAllLayers("size", val); else updateSelectedLayer("size", val); }} style={inputStyle} /></div>
                    </div>
                  </div>
                </div>
              </CardWrapper>
            </div>

            {/* Layer 1: Text PNG */}
            <div key="layer1">
              <CardWrapper 
                id="layer1" title="Layer 1: Text PNG Output" icon={<span style={{fontSize:'12px'}}>🔤</span>}
                isExpanded={expandedCards.layer1} onToggle={() => toggleCard("layer1")}
                headerExtra={<button onClick={handleDownloadText} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", cursor: "pointer" }}><DownloadIcon /></button>}
                contentStyle={{ display: "flex", justifyContent: "center", background: "#f0f0f1", backgroundImage: "radial-gradient(#dbdbdb 1px, transparent 0), radial-gradient(#dbdbdb 1px, transparent 0)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px", position: "relative", overflow: "hidden" }}
              >
                <canvas ref={textCanvasRef} style={{ display: "none" }} />
                <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ position: "absolute", left: 0, top: 0, transform: `translate(${textX}px, ${textY}px)`, cursor: dragInfo.isDragging ? "grabbing" : "grab", textShadow: "0 1px 3px rgba(0,0,0,0.2)", userSelect: "none", touchAction: "none" }}>
                  <div style={{ fontWeight: 900, lineHeight: lineHeight }}>
                    {textLayers.map(layer => layer.text && <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ color: layer.color, fontFamily: `"${layer.font}", sans-serif`, fontSize: layer.size * 0.7, cursor: "pointer", border: selectedLayerId === layer.id ? "1px dashed #666" : "1px solid transparent", padding: 2, margin: -2 }}>{layer.text}</div>)}
                  </div>
                  {subTextLayer.text && <div onClick={() => setSelectedLayerId('sub')} style={{ color: subTextLayer.color, fontFamily: `"${subTextLayer.font}", sans-serif`, fontSize: subTextLayer.size * 0.8, fontWeight: 600, opacity: 0.9, whiteSpace: "pre-line", lineHeight: 1.3, cursor: "pointer", border: selectedLayerId === 'sub' ? "1px dashed #666" : "1px solid transparent", padding: 2, margin: -2, marginTop: 16 }}>{subTextLayer.text}</div>}
                </div>
              </CardWrapper>
            </div>

            {/* Layer 3: Final Ad */}
            <div key="layer3">
              <CardWrapper 
                id="layer3" title="Layer 3: Final Composited Ad" icon={<LayersIcon />}
                isExpanded={expandedCards.layer3} onToggle={() => toggleCard("layer3")}
                headerExtra={<button onClick={handleFinalMerge} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-sm)", background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>{merging ? "..." : "Compile"}</button>}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%" }}>
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {finalImage ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", height: "100%" }}>
                      <div style={{ flex: 1, position: "relative", width: "100%", overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <img src={finalImage} alt="Final" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <button onClick={handleDownload} style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#10b981", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}><DownloadIcon /> Download</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}><p style={{ fontSize: "0.85rem", fontWeight: 500 }}>Merger not compiled.</p></div>
                  )}
                </div>
              </CardWrapper>
            </div>

          </ResponsiveGridLayout>
        </div>

        {/* EXTRA RIGHT COLUMN: Cloud LLM Chat Panel (Collapsible) */}
        <div style={{ 
          width: isChatCollapsed ? "50px" : "400px", 
          transition: "width 0.3s ease", 
          position: "sticky", 
          top: 20, 
          height: "calc(100vh - 120px)",
          zIndex: 50
        }}>
          <WebLLMChatPanel isCollapsed={isChatCollapsed} onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)} />
        </div>

      </div>
    </main>
  );
}

// ── Typography Box Style Helpers ────────────────────────────────────────────────
const labelStyle = { display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6, fontFamily: "var(--font-mono)" };
const inputStyle = { width: "100%", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: "0.875rem", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-primary)", boxSizing: "border-box" };
const selectStyle = { width: "100%", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "9.5px 12px", fontSize: "0.875rem", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-primary)", cursor: "pointer", boxSizing: "border-box" };
