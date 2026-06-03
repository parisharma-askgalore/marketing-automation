import React, { useState, useRef } from 'react';

// Shared styling utilities matching the rest of the app
const btnStyle = (disabled, primary = true) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: disabled ? "var(--bg-tertiary)" : primary ? "var(--accent)" : "var(--bg-primary)",
  color: disabled ? "var(--text-muted)" : primary ? "#fff" : "var(--text-primary)",
  border: primary ? "1px solid transparent" : "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)", padding: "10px 20px",
  fontSize: "0.875rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
});

const inputStyle = {
  width: "100%", padding: "10px 14px", fontSize: "0.875rem",
  border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
  background: "transparent", color: "var(--text-primary)",
  fontFamily: "inherit", transition: "border 0.15s",
};

const labelStyle = {
  display: "block", fontSize: "0.8rem", fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 6,
};

const cardStyle = {
  background: "var(--bg-primary)", border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)",
  overflow: "hidden", marginBottom: 24
};

const headerStyle = {
  padding: "16px 20px", borderBottom: "1px solid var(--border-color)",
  background: "var(--bg-secondary)", display: "flex", alignItems: "center",
  justifyContent: "space-between",
};

const headerTitleStyle = {
  fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em",
  textTransform: "uppercase", color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
};

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);

function SpinnerIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function MediaReview() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' or 'seed'

  // Analyze State
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Seed State
  const [project, setProject] = useState('');
  const [seedMediaType, setSeedMediaType] = useState('image');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (e.target.files[0].type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    try {
      const res = await fetch(`${API_BASE}/api/review/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Analysis request failed');
      }
      
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeed = async () => {
    if (!feedbackInput.trim()) return;
    setIsSeeding(true);
    setSeedResult(null);
    setError(null);

    const feedbackLines = feedbackInput.split('\n').filter(line => line.trim().length > 0);

    try {
      const res = await fetch(`${API_BASE}/api/review/capture-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project || 'Unknown Project',
          media_type: seedMediaType,
          feedback: feedbackLines
        }),
      });

      if (!res.ok) {
        throw new Error('Seed request failed');
      }

      const data = await res.json();
      setSeedResult(data);
      setFeedbackInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "32px 24px 80px" }}>
      
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Media Review Agent</h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>Automated recurring issue detection for marketing creatives.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('analyze')}
          style={{
            background: "transparent", border: "none", fontSize: "0.95rem", fontWeight: 600,
            color: activeTab === 'analyze' ? "var(--text-primary)" : "var(--text-muted)",
            padding: "8px 4px", cursor: "pointer", borderBottom: activeTab === 'analyze' ? "2px solid var(--text-primary)" : "2px solid transparent",
            marginBottom: -17, transition: "all 0.15s"
          }}
        >
          Analyze Media
        </button>
        <button 
          onClick={() => setActiveTab('seed')}
          style={{
            background: "transparent", border: "none", fontSize: "0.95rem", fontWeight: 600,
            color: activeTab === 'seed' ? "var(--text-primary)" : "var(--text-muted)",
            padding: "8px 4px", cursor: "pointer", borderBottom: activeTab === 'seed' ? "2px solid var(--text-primary)" : "2px solid transparent",
            marginBottom: -17, transition: "all 0.15s"
          }}
        >
          Seed Feedback Database
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 24, fontSize: "0.875rem" }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      {activeTab === 'analyze' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div className="fade-in" style={cardStyle}>
            <div style={headerStyle}>
              <span style={headerTitleStyle}>Upload Creative</span>
            </div>
            <div style={{ padding: 24 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)",
                  padding: "40px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                  background: "var(--bg-secondary)"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
              >
                <input 
                  type="file" 
                  ref={fileRef}
                  style={{ display: "none" }} 
                  accept="image/*,video/*"
                  onChange={handleFileChange} 
                />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <ImageIcon /> 
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Click to attach an image or video</span>
                  <span style={{ fontSize: "0.8rem" }}>MP4, JPG, PNG</span>
                </div>
              </div>
              
              {file && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", fontWeight: 500 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{mediaType === 'video' ? '🎥' : '🖼️'}</span>
                    <span>{file.name}</span>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  style={btnStyle(!file || isAnalyzing, true)}
                >
                  {isAnalyzing ? (
                    <><SpinnerIcon /> Analyzing...</>
                  ) : 'Run Analysis'}
                </button>
              </div>
            </div>
          </div>

          {analysisResult && (
            <div className="fade-in" style={cardStyle}>
              <div style={headerStyle}>
                <span style={headerTitleStyle}>Review Report</span>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>
                    Recurring Issues Detected
                  </h3>
                  
                  {analysisResult.report.recurring_issues?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {analysisResult.report.recurring_issues.map((issue, idx) => (
                        <div key={idx} style={{ background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "var(--radius-md)", padding: 16, display: "flex", gap: 12 }}>
                          <div style={{ color: "#e11d48", fontSize: "1.2rem" }}>🔴</div>
                          <div>
                            <p style={{ fontWeight: 600, color: "#9f1239", marginBottom: 4 }}>{issue.issue}</p>
                            <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "#be123c" }}>
                              <span>Confidence: {(issue.confidence_score * 100).toFixed(0)}%</span>
                              <span>Matches past reviews: {issue.historical_matches}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "var(--radius-md)", padding: 16, color: "#15803d", fontWeight: 500 }}>
                      ✨ No recurring issues detected!
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>
                    Raw Observations
                  </h3>
                  <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: 16, fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                    {JSON.stringify(analysisResult.observations, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'seed' && (
        <div className="fade-in" style={cardStyle}>
          <div style={headerStyle}>
            <span style={headerTitleStyle}>Seed Past Feedback</span>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 24 }}>
              Paste raw feedback from previous reviews. It will be converted into atomic rules and stored in the vector database to catch recurring mistakes.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Project Name (Optional)</label>
                <input 
                  type="text" 
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  placeholder="e.g. Holiday Creative 12"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Media Type</label>
                <select 
                  value={seedMediaType}
                  onChange={e => setSeedMediaType(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Raw Feedback (One per line)</label>
              <textarea 
                rows={6}
                value={feedbackInput}
                onChange={e => setFeedbackInput(e.target.value)}
                placeholder="CTA too close to bottom edge&#10;Avatar smile looks unnatural&#10;Logo appears too late"
                style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSeed}
                disabled={isSeeding || !feedbackInput.trim()}
                style={btnStyle(isSeeding || !feedbackInput.trim(), true)}
              >
                {isSeeding ? <><SpinnerIcon /> Processing...</> : 'Save Feedback Rules'}
              </button>
            </div>

            {seedResult && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border-color)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                  ✓ Successfully saved {seedResult.rules.length} rules
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {seedResult.rules.map((rule, idx) => (
                    <div key={idx} style={{ background: "var(--bg-tertiary)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <strong style={{ fontSize: "0.8rem", display: "block", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{rule.rule}</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{rule.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
