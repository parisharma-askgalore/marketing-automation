import React, { useState, useRef, useEffect, useCallback } from 'react';

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

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

// ── RuleRow – inline editable rule card ──────────────────────────────────────
function RuleRow({ rule, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [ruleText, setRuleText] = useState(rule.rule_text);
  const [originalText, setOriginalText] = useState(rule.original || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Parse "[RULE_NAME] description" into parts for display
  const ruleNameMatch = rule.rule_text.match(/^\[([^\]]+)\]\s*(.*)/s);
  const ruleName = ruleNameMatch ? ruleNameMatch[1] : 'RULE';
  const ruleDesc = ruleNameMatch ? ruleNameMatch[2] : rule.rule_text;

  const handleSave = async () => {
    setSaving(true);
    await onSave(rule.id, ruleText, originalText);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(rule.id);
    setDeleting(false);
  };

  const handleCancel = () => {
    setRuleText(rule.rule_text);
    setOriginalText(rule.original || '');
    setEditing(false);
  };

  return (
    <div className="fade-in" style={{
      border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
      background: "var(--bg-primary)", overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", background: "var(--bg-secondary)",
        borderBottom: editing ? "1px solid var(--border-color)" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em", color: "var(--accent)",
            background: "var(--bg-tertiary)", padding: "2px 8px",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
          }}>{ruleName}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {rule.project} · {rule.media_type}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 500, border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <EditIcon /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 500, border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", background: "transparent", color: deleting ? "var(--text-muted)" : "var(--text-secondary)", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => { if (!deleting) { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#dc2626"; } }}
                onMouseLeave={e => { if (!deleting) { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {deleting ? <SpinnerIcon size={12} /> : <TrashIcon />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 600, border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", background: "var(--accent)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {saving ? <SpinnerIcon size={12} /> : <CheckIcon />} Save
              </button>
              <button
                onClick={handleCancel}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 500, border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
              >
                <XIcon /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px" }}>
        {!editing ? (
          <>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: rule.original ? 8 : 0, lineHeight: 1.6 }}>{ruleDesc}</p>
            {rule.original && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Original: "{rule.original}"
              </p>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Rule Text</label>
              <textarea
                value={ruleText}
                onChange={e => setRuleText(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Original Feedback Context</label>
              <input
                type="text"
                value={originalText}
                onChange={e => setOriginalText(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaReview() {
  const [activeTab, setActiveTab] = useState('analyze');

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

  // Knowledge Base State
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [kbSearch, setKbSearch] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await fetch(`${API_BASE}/api/review/feedback`);
      if (!res.ok) throw new Error('Failed to load rules');
      const data = await res.json();
      setRules(data.rules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRules(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (activeTab === 'knowledge') fetchRules();
  }, [activeTab, fetchRules]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMediaType(e.target.files[0].type.startsWith('video/') ? 'video' : 'image');
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
      const res = await fetch(`${API_BASE}/api/review/analyze`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Analysis request failed');
      setAnalysisResult(await res.json());
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
    const feedbackLines = feedbackInput.split('\n').filter(l => l.trim().length > 0);
    try {
      const res = await fetch(`${API_BASE}/api/review/capture-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: project || 'Unknown Project', media_type: seedMediaType, feedback: feedbackLines }),
      });
      if (!res.ok) throw new Error('Seed request failed');
      const data = await res.json();
      setSeedResult(data);
      setFeedbackInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSaveRule = async (id, ruleText, original) => {
    try {
      await fetch(`${API_BASE}/api/review/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_text: ruleText, original }),
      });
      setRules(prev => prev.map(r => r.id === id ? { ...r, rule_text: ruleText, original } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await fetch(`${API_BASE}/api/review/feedback/${id}`, { method: 'DELETE' });
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRules = rules.filter(r => {
    const q = kbSearch.toLowerCase();
    return !q || r.rule_text.toLowerCase().includes(q) || r.original?.toLowerCase().includes(q) || r.project?.toLowerCase().includes(q);
  });

  // Group by project
  const grouped = filteredRules.reduce((acc, rule) => {
    const key = rule.project || 'Unknown Project';
    if (!acc[key]) acc[key] = [];
    acc[key].push(rule);
    return acc;
  }, {});

  const tabs = [
    { key: 'analyze', label: 'Analyze Media' },
    { key: 'seed', label: 'Seed Feedback' },
    { key: 'knowledge', label: 'Knowledge Base' },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
    <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "32px 24px 80px" }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Media Review Agent</h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>Automated recurring issue detection for marketing creatives.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 20, marginBottom: 32, borderBottom: "1px solid var(--border-color)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: "transparent", border: "none", fontSize: "0.9rem", fontWeight: 600,
              color: activeTab === t.key ? "var(--text-primary)" : "var(--text-muted)",
              padding: "8px 0", cursor: "pointer",
              borderBottom: activeTab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s", fontFamily: "inherit",
            }}
          >
            {t.label}
            {t.key === 'knowledge' && rules.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: "0.7rem", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-muted)", padding: "1px 6px", borderRadius: 99, fontFamily: "var(--font-mono)" }}>
                {rules.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 24, fontSize: "0.875rem" }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* ── Analyze Tab ── */}
      {activeTab === 'analyze' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="fade-in" style={cardStyle}>
            <div style={headerStyle}><span style={headerTitleStyle}>Upload Creative</span></div>
            <div style={{ padding: 24 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "40px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.15s", background: "var(--bg-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
              >
                <input type="file" ref={fileRef} style={{ display: "none" }} accept="image/*,video/*" onChange={handleFileChange} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <ImageIcon />
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Click to attach an image or video</span>
                  <span style={{ fontSize: "0.8rem" }}>MP4, JPG, PNG</span>
                </div>
              </div>

              {file && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", fontWeight: 500 }}>
                    <span>{mediaType === 'video' ? '🎥' : '🖼️'}</span>
                    <span>{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleAnalyze} disabled={!file || isAnalyzing} style={btnStyle(!file || isAnalyzing, true)}>
                  {isAnalyzing ? <><SpinnerIcon /> Analyzing...</> : 'Run Analysis'}
                </button>
              </div>
            </div>
          </div>

          {analysisResult && (
            <div className="fade-in" style={cardStyle}>
              <div style={headerStyle}><span style={headerTitleStyle}>Review Report</span></div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>Recurring Issues Detected</h3>
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
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>Raw Observations</h3>
                  <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: 16, fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                    {JSON.stringify(analysisResult.observations, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Seed Tab ── */}
      {activeTab === 'seed' && (
        <div className="fade-in" style={cardStyle}>
          <div style={headerStyle}><span style={headerTitleStyle}>Seed Past Feedback</span></div>
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 24 }}>
              Paste raw feedback from previous reviews. It will be converted into atomic rules and stored in the vector database to catch recurring mistakes.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Project Name (Optional)</label>
                <input type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="e.g. Holiday Creative 12" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Media Type</label>
                <select value={seedMediaType} onChange={e => setSeedMediaType(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Raw Feedback (One per line)</label>
              <textarea rows={6} value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)}
                placeholder={"CTA too close to bottom edge\nAvatar smile looks unnatural\nLogo appears too late"}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSeed} disabled={isSeeding || !feedbackInput.trim()} style={btnStyle(isSeeding || !feedbackInput.trim(), true)}>
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

      {/* ── Knowledge Base Tab ── */}
      {activeTab === 'knowledge' && (
        <div className="fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <input
                type="text"
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                placeholder="Search rules, context or project..."
                style={inputStyle}
              />
            </div>
            <button onClick={fetchRules} disabled={loadingRules} style={btnStyle(loadingRules, false)}>
              {loadingRules ? <SpinnerIcon /> : '↻'} Refresh
            </button>
          </div>

          {loadingRules ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <SpinnerIcon size={24} />
              <span>Loading knowledge base...</span>
            </div>
          ) : rules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <p style={{ marginBottom: 8 }}>No rules stored yet.</p>
              <p style={{ fontSize: "0.85rem" }}>Go to the <strong>Seed Feedback</strong> tab to add your first rules.</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              No rules match your search.
            </div>
          ) : (
            Object.entries(grouped).map(([projectName, projectRules]) => (
              <div key={projectName} style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {projectName}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "1px 6px", borderRadius: 99, fontFamily: "var(--font-mono)" }}>
                    {projectRules.length} rule{projectRules.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectRules.map(rule => (
                    <RuleRow key={rule.id} rule={rule} onSave={handleSaveRule} onDelete={handleDeleteRule} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
    </div>
  );
}
