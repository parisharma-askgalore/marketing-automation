import { useState, useRef, useEffect } from "react";

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

  // Text Layer State
  const [line1, setLine1] = useState("Take");
  const [line2, setLine2] = useState("the climb.");
  const [line3, setLine3] = useState("Keep the");
  const [line4, setLine4] = useState("sales moving.");
  const [subText, setSubText] = useState("Zero Code 3D\nAI Sales Chatbot\nfor your business\nwebsite.");
  const [selectedFont, setSelectedFont] = useState("Outfit");
  const [textColor, setTextColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#2563eb"); // Blue accent like in the climb.
  const [fontSize, setFontSize] = useState(38);
  const [subFontSize, setSubFontSize] = useState(20);
  const [textX, setTextX] = useState(40);
  const [textY, setTextY] = useState(60);
  const [lineHeight, setLineHeight] = useState(1.25);

  // Merge & Canvas State
  const canvasRef = useRef(null);
  const [finalImage, setFinalImage] = useState(null);
  const [merging, setMerging] = useState(false);

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

    // Draw Headline Text
    let currentY = textY;
    const lines = [
      { text: line1, isAccent: false },
      { text: line2, isAccent: true },
      { text: line3, isAccent: false },
      { text: line4, isAccent: true }
    ].filter(l => l.text.trim() !== "");

    lines.forEach(line => {
      ctx.font = `800 ${fontSize}px "${selectedFont}", sans-serif`;
      ctx.fillStyle = line.isAccent ? accentColor : textColor;
      
      // Shadow/Glow for crispness against varied backgrounds
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(line.text, textX, currentY);
      
      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      currentY += fontSize * lineHeight;
    });

    // Draw thin elegant line separator (similar to reference)
    if (lines.length > 0 && subText.trim() !== "") {
      currentY += 12;
      ctx.fillStyle = accentColor;
      ctx.fillRect(textX, currentY, 40, 3.5);
      currentY += 16;
    }

    // Draw Sub-text Paragraph
    if (subText.trim() !== "") {
      ctx.font = `600 ${subFontSize}px "${selectedFont}", sans-serif`;
      ctx.fillStyle = textColor;
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const subLines = subText.split("\n");
      subLines.forEach(subLine => {
        ctx.fillText(subLine, textX, currentY);
        currentY += subFontSize * 1.3;
      });
      
      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  };

  // Re-render preview canvas whenever overlay parameters change
  useEffect(() => {
    drawCanvas();
  }, [baseSceneImg, aspectRatio, line1, line2, line3, line4, subText, selectedFont, textColor, accentColor, fontSize, subFontSize, textX, textY, lineHeight]);

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

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }} className="fade-in">
        
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Headline Line 1</label>
                  <input value={line1} onChange={(e) => setLine1(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Headline Line 2 (Accent Color)</label>
                  <input value={line2} onChange={(e) => setLine2(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Headline Line 3</label>
                  <input value={line3} onChange={(e) => setLine3(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Headline Line 4 (Accent Color)</label>
                  <input value={line4} onChange={(e) => setLine4(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Sub-headline Description Paragraph</label>
                <textarea
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  style={{
                    width: "100%", height: 75, border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: "0.875rem",
                    color: "var(--text-primary)", background: "var(--bg-primary)", resize: "none",
                    fontFamily: "inherit", lineHeight: 1.4
                  }}
                  placeholder="Additional promotional or features details to display underneath..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Selected Font</label>
                  <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={selectStyle}>
                    {FontsList.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Font Color</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: 36, height: 36, border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                    <input value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "8px" }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Accent Color</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: 36, height: 36, border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                    <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "8px" }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Header Size</label>
                  <input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 20)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Sub Size</label>
                  <input type="number" value={subFontSize} onChange={(e) => setSubFontSize(parseInt(e.target.value) || 12)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>X Align (%)</label>
                  <input type="number" value={textX} onChange={(e) => setTextX(parseInt(e.target.value) || 0)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Y Align (%)</label>
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
              display: "flex", alignItems: "center", justify: "space-between", padding: "12px 20px",
              borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Layer 1: Text Wall Layer (Transparent PNG Model)
              </span>
            </div>
            <div style={{ padding: 20, display: "flex", justifyContent: "center", background: "#f0f0f1", backgroundImage: "radial-gradient(#dbdbdb 1px, transparent 0), radial-gradient(#dbdbdb 1px, transparent 0)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px" }}>
              {/* Box showing the typography overlay styled in real-time */}
              <div style={{
                width: 320, padding: 24, borderRadius: "var(--radius-md)", 
                fontFamily: `"${selectedFont}", sans-serif`, color: textColor, textShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }}>
                <div style={{ fontSize: fontSize * 0.7, fontWeight: 900, lineHeight: lineHeight }}>
                  {line1 && <div style={{ color: textColor }}>{line1}</div>}
                  {line2 && <div style={{ color: accentColor }}>{line2}</div>}
                  {line3 && <div style={{ color: textColor }}>{line3}</div>}
                  {line4 && <div style={{ color: accentColor }}>{line4}</div>}
                </div>
                {(line1 || line2 || line3 || line4) && subText.trim() !== "" && (
                  <div style={{ width: 30, height: 3, background: accentColor, margin: "12px 0" }} />
                )}
                {subText && (
                  <div style={{ fontSize: subFontSize * 0.8, fontWeight: 600, opacity: 0.9, whiteSpace: "pre-line", lineHeight: 1.3 }}>
                    {subText}
                  </div>
                )}
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
