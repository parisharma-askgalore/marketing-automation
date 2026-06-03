import { useState, useRef, useEffect } from "react";
import WebLLMChatPanel from "../components/WebLLMChatPanel";// ── Icons ──────────────────────────────────────────────────────────────────────
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

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const FontsList = ["Inter", "Outfit", "Playfair Display", "Roboto", "Montserrat", "Lora", "Courier New"];

export default function ImageGenerations() {
  // Preloaded Global Prompt
  const [globalPrompt, setGlobalPrompt] = useState(
    "Hyper-realistic professional advertising photography, commercial lighting, cinematic compositions, highly detailed 8k, photorealistic skin textures, natural gravitational cloth simulation, perfect anatomical correctness and human physics, flawless facial consistency, crisp edges, premium quality."
  );

  // Inputs
  const [userPrompt, setUserPrompt] = useState("A hyper-realistic premium female mountaineer holding a steel thermos mug, sitting on Everest basecamp rocks, looking directly at the camera with extreme detail, background of massive snowy blue sky mountains.");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [generatingBg, setGeneratingBg] = useState(false);
  const [baseSceneImg, setBaseSceneImg] = useState(null); // Generated base scene image base64
  
  // Reference Images State
  const [references, setReferences] = useState([]);
  const fileInputRef = useRef(null);

  // Optimization State
  const [userDirection, setUserDirection] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Image Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIframeUrl, setActiveIframeUrl] = useState("");


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
  
  const [selectedLayerId, setSelectedLayerId] = useState(null); // null = global, 1-4 = headline, 'sub' = subtext

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
    setDragInfo({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initTextX: textX,
      initTextY: textY
    });
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

  // Dynamic Google Font Injection
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=Roboto:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Handle file uploads for references
  const handleReferenceUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setReferences(prev => [...prev, { name: file.name, url: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (index) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // Optimize Prompt using Backend API
  const handleOptimizePrompt = async () => {
    if (!userDirection.trim()) return;
    try {
      setIsOptimizing(true);
      const response = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userDirection,
          globalPrompt,
          referencesCount: references.length
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const reason = data?.error || data?.details || `HTTP ${response.status}`;
        throw new Error(reason);
      }

      if (data.optimizedPrompt) {
        setUserPrompt(data.optimizedPrompt);
      }
    } catch (error) {
      console.error("Optimize prompt error:", error);
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

  const addSearchedImageAsReference = (url, title) => {
    setReferences(prev => [...prev, { name: title || "Searched Image", url }]);
  };

  // Generate Base Background + Character using Gemini
  const handleGenerateBaseScene = async () => {
    try {
      setGeneratingBg(true);
      // Combine prompt, assets descriptions, and the global prompt
      const finalPrompt = `${userPrompt}. Instructions for style and physics: ${globalPrompt}`;
      
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspect_ratio: aspectRatio
        })
      });

      if (!response.ok) {
        let errMsg = "Failed to generate image base scene.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = errData.detail;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.status === "success") {
        setBaseSceneImg(data.image);
      }
    } catch (error) {
      console.error("Base scene generation error:", error);
      alert("Error: " + error.message);
    } finally {
      setGeneratingBg(false);
    }
  };

  // Interactive Live Canvas Rendering helper
  const drawCanvas = (isFinal = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions based on aspect ratio or loaded image
    let width = 600;
    let height = 600;
    if (aspectRatio === "9:16") {
      width = 450;
      height = 800;
    } else if (aspectRatio === "16:9") {
      width = 800;
      height = 450;
    }

    canvas.width = width;
    canvas.height = height;

    // 1. Draw Base Scene Image or placeholder
    if (baseSceneImg) {
      const img = new Image();
      img.src = baseSceneImg;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawTextOverlay(ctx, width, height);
        if (isFinal) {
          setFinalImage(canvas.toDataURL("image/png"));
        }
      };
    } else {
      // Checkered blank pattern placeholder
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Base Scene Layer Placeholder (Generate scene or overlay on transparent text)", width / 2, height / 2);
      drawTextOverlay(ctx, width, height);
    }
  };

  const drawTextOverlay = (ctx, w, h) => {
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    let currentY = textY;
    
    textLayers.filter(l => l.text.trim() !== "").forEach(line => {
      ctx.font = `800 ${line.size}px "${line.font}", sans-serif`;
      ctx.fillStyle = line.color;
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

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
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; 
      ctx.shadowBlur = 4; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;

      const subLines = subTextLayer.text.split("\n");
      subLines.forEach(subLine => {
        ctx.fillText(subLine, textX, currentY);
        currentY += subTextLayer.size * 1.3;
      });
      
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }
  };

  // Re-render preview canvas whenever overlay parameters change
  useEffect(() => {
    drawCanvas();
  }, [baseSceneImg, aspectRatio, textLayers, subTextLayer, textX, textY, lineHeight]);

  // Final Merge Action
  const handleFinalMerge = async () => {
    setMerging(true);
    // Draw canvas fully and output base64
    setTimeout(() => {
      drawCanvas(true);
      setMerging(false);
    }, 800);
  };

  // Trigger high-res creative download
  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement("a");
    link.download = `creative_generation_${Date.now()}.png`;
    link.href = finalImage;
    link.click();
  };

  const handleDownloadText = () => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let width = 600;
    let height = 600;
    if (aspectRatio === "9:16") { width = 450; height = 800; }
    else if (aspectRatio === "16:9") { width = 800; height = 450; }
    
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height); // Transparent
    drawTextOverlay(ctx, width, height);
    
    const link = document.createElement("a");
    link.download = `typography_overlay_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main style={{ maxWidth: "var(--max-width, 1400px)", margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Title Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Image Generations</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Generate hyper-realistic marketing assets preloaded with consistency directives and custom typography elements.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{
            fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)",
            background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
            color: "var(--text-secondary)", padding: "5px 12px", borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", gap: 6
          }}>
            Model: grok-imagine-image-quality
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr) 350px", gap: 24, alignItems: "start" }} className="fade-in">
        
        {/* LEFT COLUMN: CONTROL & DIRECTIVES PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Global Style Prompt Config */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <SparklesIcon />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Global Prompts (Character & Physics Directives)
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <textarea
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                style={{
                  width: "100%", height: 75, border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: "0.85rem",
                  color: "var(--text-primary)", background: "var(--bg-secondary)", resize: "none",
                  fontFamily: "var(--font-mono)", lineHeight: 1.5
                }}
                placeholder="Directives to maintain hyper-realism, consistent styling, realistic physics, etc."
              />
            </div>
          </div>

          {/* Reference Image Attachments */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Reference Assets & Characters
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)",
                  padding: "24px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Upload Subject, Character or Style References</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Images will inform character consistency</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleReferenceUpload} />
              
              {/* Image Search Box */}
              <div style={{ marginTop: 16, background: "var(--bg-tertiary)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <form onSubmit={handleSearchImages} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Pexels..."
                    style={{ ...inputStyle, flex: 1, padding: "8px 12px", fontSize: "0.8rem" }}
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    style={{
                      background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", 
                      borderRadius: "var(--radius-md)", padding: "0 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    Search
                  </button>
                </form>
                {activeIframeUrl && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pexels Results</span>
                      <a href={activeIframeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>Open in New Tab ↗</a>
                    </div>
                    <iframe 
                      src={activeIframeUrl} 
                      style={{ width: "100%", height: 400, border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
                      title="Pexels Image Search"
                    />
                  </div>
                )}
              </div>

              
              {references.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                  {references.map((ref, idx) => (
                    <div key={idx} style={{ position: "relative", width: 64, height: 64, borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                      <img src={ref.url} alt={ref.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        onClick={() => removeReference(idx)}
                        style={{
                          position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scene and Subject Generation Inputs */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Scene & Subject Generation Setup (Base Layer)
              </span>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 16, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: 4 }}>
                <label style={labelStyle}>Quick User Direction (Auto-Optimizer)</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={userDirection}
                    onChange={(e) => setUserDirection(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="E.g., A futuristic robot holding a glowing orb"
                  />
                  <button
                    onClick={handleOptimizePrompt}
                    disabled={isOptimizing || !userDirection.trim()}
                    style={{
                      background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)",
                      padding: "0 16px", fontSize: "0.85rem", fontWeight: 600, cursor: isOptimizing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, opacity: isOptimizing ? 0.7 : 1
                    }}
                  >
                    {isOptimizing ? <SpinnerIcon /> : <SparklesIcon />} Optimize
                  </button>
                </div>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 8, lineHeight: 1.4 }}>
                  This will generate an optimized prompt below, factoring in your global prompt and references.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Subject & Scene Prompt</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  style={{
                    width: "100%", height: 90, border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.875rem",
                    color: "var(--text-primary)", background: "var(--bg-primary)", resize: "none",
                    fontFamily: "inherit", lineHeight: 1.5
                  }}
                  placeholder="Describe your primary character, clothing, pose, action, and detailed setting..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Aspect Ratio</label>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="1:1">1:1 Square (Reference style)</option>
                    <option value="9:16">9:16 Vertical Reel</option>
                    <option value="16:9">16:9 Landscape</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={handleGenerateBaseScene}
                    disabled={generatingBg || !userPrompt.trim()}
                    style={{
                      width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: generatingBg ? "var(--bg-tertiary)" : "var(--accent)",
                      color: generatingBg ? "var(--text-muted)" : "#fff",
                      border: "none", borderRadius: "var(--radius-md)", padding: "11px 20px",
                      fontSize: "0.875rem", fontWeight: 600, cursor: generatingBg ? "not-allowed" : "pointer",
                      fontFamily: "inherit", transition: "all 0.15s"
                    }}
                  >
                    {generatingBg ? <><SpinnerIcon /> Generating Base Scene…</> : <><SparklesIcon /> Generate Base Scene</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Typography overlay settings */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Typography Wall Settings (Overlay Layer)
              </span>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Text Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {textLayers.map((layer) => (
                  <div key={layer.id}>
                    <label style={labelStyle}>Headline Line {layer.id}</label>
                    <input 
                      value={layer.text} 
                      onChange={(e) => setTextLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: e.target.value } : l))} 
                      style={inputStyle} 
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={labelStyle}>Sub-headline Description Paragraph</label>
                <textarea
                  value={subTextLayer.text}
                  onChange={(e) => setSubTextLayer(prev => ({ ...prev, text: e.target.value }))}
                  style={{
                    width: "100%", height: 75, border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: "0.875rem",
                    color: "var(--text-primary)", background: "var(--bg-primary)", resize: "none",
                    fontFamily: "inherit", lineHeight: 1.4
                  }}
                  placeholder="Additional promotional or features details to display underneath..."
                />
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", margin: "16px 0", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    {selectedLayerId === null ? "Global Styling (All Lines)" : 
                     selectedLayerId === 'sub' ? "Styling Sub-headline" : 
                     `Styling Headline Line ${selectedLayerId}`}
                  </span>
                  {selectedLayerId !== null && (
                    <button onClick={() => setSelectedLayerId(null)} style={{ background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: 4, padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}>
                      Clear Selection
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Font</label>
                    <select 
                      value={selectedLayerId === null ? textLayers[0].font : selectedLayer.font} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedLayerId === null) updateAllLayers("font", val);
                        else updateSelectedLayer("font", val);
                      }} 
                      style={selectStyle}
                    >
                      {FontsList.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Color</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input 
                        type="color" 
                        value={selectedLayerId === null ? textLayers[0].color : selectedLayer.color} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedLayerId === null) updateAllLayers("color", val);
                          else updateSelectedLayer("color", val);
                        }} 
                        style={{ width: 36, height: 36, border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", padding: 0 }} 
                      />
                      <input 
                        value={selectedLayerId === null ? textLayers[0].color : selectedLayer.color} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedLayerId === null) updateAllLayers("color", val);
                          else updateSelectedLayer("color", val);
                        }} 
                        style={{ ...inputStyle, flex: 1, padding: "8px" }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Size</label>
                    <input 
                      type="number" 
                      value={selectedLayerId === null ? textLayers[0].size : selectedLayer.size} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 20;
                        if (selectedLayerId === null) updateAllLayers("size", val);
                        else updateSelectedLayer("size", val);
                      }} 
                      style={inputStyle} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Global X Align (%)</label>
                  <input type="number" value={textX} onChange={(e) => setTextX(parseInt(e.target.value) || 0)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Global Y Align (%)</label>
                  <input type="number" value={textY} onChange={(e) => setTextY(parseInt(e.target.value) || 0)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISSECTED LAYERS & FINAL MERGER */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 20 }}>
          
          {/* Layer 1: Live Text Wall PNG Preview */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Layer 1: Text Wall Layer (Transparent PNG Model)
              </span>
              <button 
                onClick={handleDownloadText} 
                style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-primary)"; }}
              >
                <DownloadIcon /> Download Text PNG
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", justifyContent: "center", background: "#f0f0f1", backgroundImage: "radial-gradient(#dbdbdb 1px, transparent 0), radial-gradient(#dbdbdb 1px, transparent 0)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px", position: "relative", overflow: "hidden", minHeight: 320 }}>
              {/* Hidden text canvas for exporting PNG */}
              <canvas ref={textCanvasRef} style={{ display: "none" }} />
              
              {/* Box showing the typography overlay styled in real-time */}
              <div 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: "absolute",
                  left: 0, top: 0,
                  transform: `translate(${textX}px, ${textY}px)`,
                  cursor: dragInfo.isDragging ? "grabbing" : "grab",
                  textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  userSelect: "none",
                  touchAction: "none"
                }}
              >
                <div style={{ fontWeight: 900, lineHeight: lineHeight }}>
                  {textLayers.map(layer => layer.text && (
                    <div 
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      style={{ 
                        color: layer.color, 
                        fontFamily: `"${layer.font}", sans-serif`, 
                        fontSize: layer.size * 0.7,
                        cursor: "pointer",
                        border: selectedLayerId === layer.id ? "1px dashed #666" : "1px solid transparent",
                        padding: 2,
                        margin: -2
                      }}
                    >
                      {layer.text}
                    </div>
                  ))}
                </div>
                {textLayers.some(l => l.text.trim() !== "") && subTextLayer.text.trim() !== "" && (
                  <div style={{ width: 30, height: 3, background: textLayers[1]?.color || "#2563eb", margin: "12px 0" }} />
                )}
                {subTextLayer.text && (
                  <div 
                    onClick={() => setSelectedLayerId('sub')}
                    style={{ 
                      color: subTextLayer.color,
                      fontFamily: `"${subTextLayer.font}", sans-serif`,
                      fontSize: subTextLayer.size * 0.8, 
                      fontWeight: 600, 
                      opacity: 0.9, 
                      whiteSpace: "pre-line", 
                      lineHeight: 1.3,
                      cursor: "pointer",
                      border: selectedLayerId === 'sub' ? "1px dashed #666" : "1px solid transparent",
                      padding: 2,
                      margin: -2
                    }}
                  >
                    {subTextLayer.text}
                  </div>
                )}
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 16, textAlign: "center", fontStyle: "italic" }}>
                  (Click any text above to style it individually)
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: Generated Character & Scene Base Preview */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justify: "space-between", padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Layer 2: Character + Background Layer (Grok Imagine)
              </span>
            </div>
            <div style={{ padding: 20, display: "flex", justifyContent: "center", background: "var(--bg-tertiary)", minHeight: 260, alignItems: "center" }}>
              {baseSceneImg ? (
                <div style={{ position: "relative", maxWidth: "100%", maxHeight: 360, overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  <img src={baseSceneImg} alt="Generated Background + Character Base" style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }} />
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" style={{ marginBottom: 12, opacity: 0.5 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>No base scene generated yet.</p>
                  <p style={{ fontSize: "0.75rem", marginTop: 4 }}>Configure the prompt above and click "Generate Base Scene".</p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Merger & Final Composer */}
          <div style={{
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)",
            background: "var(--bg-primary)", boxShadow: "var(--shadow-sm)", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justify: "space-between", padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Layer 3: Canvas Merger & Final Ad Composition
              </span>
              <button 
                onClick={handleFinalMerge} 
                style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                }}
              >
                {merging ? <SpinnerIcon /> : <LayersIcon />} Compile Merger
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {/* Hidden Canvas for blending */}
              <canvas ref={canvasRef} style={{ display: "none" }} />
              
              {finalImage ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                    <img src={finalImage} alt="Final Ad Merger Creative" style={{ width: "100%", height: "auto", display: "block" }} />
                  </div>
                  <button
                    onClick={handleDownload}
                    style={{
                      width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: "#10b981", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "12px 20px",
                      fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#10b981"; }}
                  >
                    <DownloadIcon /> Download High-Res Ad Creative
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>Merger not compiled.</p>
                  <p style={{ fontSize: "0.75rem", marginTop: 4 }}>Click "Compile Merger" above to overlay layers and assemble the final high-res ad.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EXTRA RIGHT COLUMN: WebLLM Chat Panel */}
        <div style={{ position: "sticky", top: 20, height: "calc(100vh - 120px)" }}>
          <WebLLMChatPanel />
        </div>

      </div>
    </main>
  );
}

// ── Typography Box Style Helpers ────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  marginBottom: 6,
  fontFamily: "var(--font-mono)",
};

const inputStyle = {
  width: "100%",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)",
  padding: "9px 12px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  color: "var(--text-primary)",
  background: "var(--bg-primary)",
  transition: "border 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const selectStyle = {
  width: "100%",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)",
  padding: "9.5px 12px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  color: "var(--text-primary)",
  background: "var(--bg-primary)",
  cursor: "pointer",
  boxSizing: "border-box",
};
