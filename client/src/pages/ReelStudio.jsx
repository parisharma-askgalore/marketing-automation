import { useState, useRef, useCallback, useEffect } from "react";
import ImageGenerations from "./ImageGenerations";
import WebLLMChatPanel from "../components/WebLLMChatPanel";
import MediaReview from "./MediaReview";
import ImageHistory from "./ImageHistory";

const API_BASE = import.meta.env.VITE_API_BASE || "https://script-auto.onrender.com";

// ── Constants ──────────────────────────────────────────────────────────────────
const STEP_ORDER = ["input", "hooks", "script", "storyboard", "keyframes", "videoHook", "videoSpeak"];
const STEP_LABELS = {
  input: "Input",
  hooks: "Hooks",
  script: "Script",
  keyframes: "Keyframes",
  storyboard: "Storyboard",
  videoHook: "Video Hook",
  videoSpeak: "Speaking Part",
};
const FIELD_LABELS = {
  input: "Project Inputs",
  hooks: "Marketing Hooks",
  script: "Script",
  keyframes: "Keyframe Prompts",
  storyboard: "Storyboard Prompt",
  videoHook: "Video Hook Prompt",
  videoSpeak: "Speaking Part",
};

function sim(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function SpinnerIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5-4v-4" /><polyline points="3 3 3 7 7 7" />
  </svg>
);
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const FolderIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const LayersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const UploadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const ModelIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" /><path d="M9 9h6v6H9z" /><path d="M4 20v-4" /><path d="M20 20v-4" /><path d="M4 8V4" /><path d="M20 8V4" />
  </svg>
);

// ── Shared Buttons ─────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: disabled ? "var(--bg-tertiary)" : "var(--accent)",
        color: disabled ? "var(--text-muted)" : "#fff",
        border: "1px solid transparent",
        borderRadius: "var(--radius-md)", padding: "10px 20px",
        fontSize: "0.875rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--accent-hover)"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "var(--accent)"; }}
    >
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: disabled ? "var(--bg-tertiary)" : "var(--bg-primary)",
        color: disabled ? "var(--text-muted)" : "var(--text-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)", padding: "10px 20px",
        fontSize: "0.875rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--bg-tertiary)"; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "var(--bg-primary)"; } }}
    >
      {children}
    </button>
  );
}

// ── Field Card ─────────────────────────────────────────────────────────────────
function FieldBox({ label, noEdit = false, onEdit, loading, children }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);

  const handleEditToggle = () => {
    setEditing((e) => !e);
    setEditText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = () => {
    if (!editText.trim()) return;
    onEdit?.(editText);
    setEditing(false);
    setEditText("");
  };

  return (
    <div className="fade-in" style={{
      marginBottom: 16, borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-color)", background: "var(--bg-primary)",
      overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
      }}>
        <span style={{
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>
              <SpinnerIcon size={12} /> Regenerating…
            </span>
          )}
          {!noEdit && !loading && (
            <button
              onClick={handleEditToggle}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "0.8rem", fontWeight: 500, padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                border: editing ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                color: editing ? "var(--accent)" : "var(--text-secondary)",
                background: editing ? "var(--bg-tertiary)" : "transparent",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              <EditIcon /> {editing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "20px" }}>
        {children}
        {editing && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe what to change…"
              style={{
                flex: 1, fontSize: "0.875rem",
                border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
                padding: "9px 14px", fontFamily: "inherit",
                color: "var(--text-primary)", background: "var(--bg-primary)",
                transition: "border 0.15s",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: "9px 12px", background: "var(--accent)", color: "#fff",
                border: "none", borderRadius: "var(--radius-md)",
                cursor: "pointer", display: "flex", alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              <SendIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentBg({ children, mono = false }) {
  return (
    <div style={{
      background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
      padding: "16px 18px", border: "1px solid var(--border-color)",
    }}>
      <p style={{
        fontSize: "0.9rem", lineHeight: 1.8,
        color: "var(--text-primary)", whiteSpace: "pre-line", margin: 0,
        fontFamily: mono ? "var(--font-mono)" : "inherit",
      }}>
        {children}
      </p>
    </div>
  );
}

function RowFlex({ children, extraStyle }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, alignItems: "center", gap: 10, ...extraStyle }}>
      {children}
    </div>
  );
}

// ── Progress Steps Bar ──────────────────────────────────────────────────────────
function StepBar({ currentStep }) {
  const curIdx = STEP_ORDER.indexOf(currentStep);
  const scrollTo = (key) => {
    const el = document.getElementById(`section-${key}`);
    const container = el?.closest("[data-scroll-container]");
    if (el && container) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 56;
      container.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20,
      background: "var(--bg-primary)",
      borderBottom: "1px solid var(--border-color)",
      overflowX: "auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        height: 48, padding: "0 24px", maxWidth: "var(--max-width, 1400px)", margin: "0 auto",
      }}>
        {STEP_ORDER.map((key, i) => {
          const idx = STEP_ORDER.indexOf(key);
          const isDone = idx < curIdx;
          const isActive = idx === curIdx;
          const isLocked = idx > curIdx;
          return (
            <span key={key} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span style={{
                  width: 24, height: 1, flexShrink: 0,
                  background: isDone ? "var(--text-primary)" : "var(--border-color)",
                  margin: "0 4px",
                }} />
              )}
              <button
                onClick={() => scrollTo(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "6px 12px", borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem", fontWeight: isActive ? 700 : 500,
                  fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                  cursor: isLocked ? "default" : "pointer",
                  border: "none", whiteSpace: "nowrap", transition: "all 0.15s",
                  background: isActive ? "var(--bg-tertiary)" : "transparent",
                  color: isActive ? "var(--text-primary)" : isDone ? "var(--text-secondary)" : "var(--text-muted)",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? "var(--text-primary)" : isDone ? "var(--text-secondary)" : "var(--border-color)",
                  border: isActive ? "none" : isDone ? "none" : "1.5px solid var(--border-color)",
                }} />
                {STEP_LABELS[key]}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Page Anchor Nav (sidebar) ──────────────────────────────────────────────────
function PageNav({ visibleSteps }) {
  const scrollTo = (key) => {
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div style={{ padding: "24px 12px" }}>
      <p style={{
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-muted)", marginBottom: 10, fontFamily: "var(--font-mono)", padding: "0 8px",
      }}>
        On this page
      </p>
      <nav>
        {visibleSteps.map((key) => (
          <button
            key={key}
            onClick={() => scrollTo(key)}
            style={{
              width: "100%", textAlign: "left", fontSize: "0.85rem", fontWeight: 500,
              color: "var(--text-secondary)", padding: "6px 8px", borderRadius: "var(--radius-sm)",
              border: "none", cursor: "pointer", background: "transparent",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)", flexShrink: 0 }} />
            {FIELD_LABELS[key]}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, open, onClose }) {
  const navItems = [
    { key: "current", label: "Current Project", icon: <LayersIcon /> },
    { key: "past",    label: "Past Projects",   icon: <FolderIcon /> },
    { key: "imageGen",label: "Image Generations",icon: <ImageIcon /> },
    { key: "mediaReview", label: "Media Review Agent", icon: <CheckIcon /> },
    { key: "history",     label: "Image History",       icon: <HistoryIcon /> },
  ];

  const sidebarContent = (
    <div style={{
      width: 240, height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg-primary)", borderRight: "1px solid var(--border-color)",
      padding: "24px 0",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border-color)", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "var(--radius-md)",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>Reel Studio</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        <p style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-muted)", padding: "0 8px", marginBottom: 6, fontFamily: "var(--font-mono)",
        }}>
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); onClose?.(); }}
              style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: "var(--radius-md)", marginBottom: 2,
                border: "none", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                fontSize: "0.875rem", fontWeight: isActive ? 600 : 500,
                background: isActive ? "var(--bg-tertiary)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <span style={{
                  marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                  background: "var(--text-primary)",
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--accent)", color: "#fff",
          fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          AG
        </div>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>Ask Galore</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Marketing Studio</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="sidebar-desktop">{sidebarContent}</div>

      {/* Mobile: overlay drawer */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
          onClick={onClose}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} />
          <div
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 101 }}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

// ── Current Project ─────────────────────────────────────────────────────────────
function CurrentProject({ onOpenSettings }) {
  const [step, setStep] = useState("input");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [fields, setFields] = useState({ hook: "", tone: "", audience: "", assets: [] });
  const [selHook, setSelHook] = useState(null);
  const [script, setScript] = useState("");
  const [keyframes, setKeyframes] = useState([]);
  const [storyboard, setStoryboard] = useState([]);
  const [marketingHooks, setMarketingHooks] = useState([]);
  const [vHook, setVHook] = useState("");
  const [vSpeak, setVSpeak] = useState("");
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [stepLoading, setStepLoading] = useState(null);
  const [editLoading, setEditLoading] = useState({});
  const [editingKf, setEditingKf] = useState(-1);
  const [editingKfText, setEditingKfText] = useState("");
  const [kfEditLoading, setKfEditLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  const curIdx = STEP_ORDER.indexOf(step);
  const visibleSteps = STEP_ORDER.slice(0, curIdx + 1);
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el && scrollRef.current) {
      const top = el.getBoundingClientRect().top - scrollRef.current.getBoundingClientRect().top + scrollRef.current.scrollTop - 56;
      scrollRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleGenerateHooks = async () => {
    try {
      setLoadingHooks(true);
      const response = await fetch(`${API_BASE}/api/generate-hooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook: fields.hook, tone: fields.tone, audience: fields.audience }),
      });
      if (!response.ok) throw new Error("Failed to generate hooks");
      const data = await response.json();
      setMarketingHooks(data.marketingHooks);
      setProjectId(data.projectId);
      await sim(1000);
      setStep("hooks");
      scrollToSection("section-hooks");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHooks(false);
    }
  };

  const handleGenerateScript = async () => {
    try {
      setLoadingScript(true);
      const response = await fetch(`${API_BASE}/api/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, selectedHook: selHook, hook: fields.hook, tone: fields.tone, audience: fields.audience }),
      });
      if (!response.ok) throw new Error("Failed to generate script");
      const data = await response.json();
      await sim(1200);
      setScript(data.script);
      setStep("script");
      scrollToSection("section-script");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingScript(false);
    }
  };

  const autoGenerateKfImages = async (kfList) => {
    const references = fields.assets.length > 0 ? [fields.assets[0].dataUrl] : [];
    // fire off all generations concurrently
    kfList.forEach((kf, idx) => {
      (async () => {
        try {
          setKeyframes((prev) => prev.map((k, i) => i === idx ? { ...k, isGenerating: true } : k));
          const res = await fetch(`${API_BASE}/api/generate-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "black-forest-labs/FLUX.1-schnell", prompt: kf.text, references }),
          });
          if (!res.ok) throw new Error("Image generation failed");
          const data = await res.json();
          setKeyframes((prev) => prev.map((k, i) => i === idx ? { ...k, image: data.image, isGenerating: false } : k));
        } catch (err) {
          console.error(`Keyframe ${idx} generation failed:`, err);
          setKeyframes((prev) => prev.map((k, i) => i === idx ? { ...k, isGenerating: false } : k));
        }
      })();
    });
  };

  const handleNext = async (from) => {
    try {
      setStepLoading(from);
      if (from === "script") {
        const response = await fetch(`${API_BASE}/api/generate-storyboard-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, keyframes: [], script, selectedHook: selHook, hook: fields.hook, tone: fields.tone, audience: fields.audience }),
        });
        if (!response.ok) throw new Error("Failed to generate storyboard");
        const data = await response.json();
        await sim(1100);
        setStoryboard(data.storyboard);
        setStep("storyboard");
        scrollToSection("section-storyboard");
      } else if (from === "storyboard") {
        const response = await fetch(`${API_BASE}/api/generate-keyframe-prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, script, selectedHook: selHook, hook: fields.hook, tone: fields.tone, audience: fields.audience }),
        });
        if (!response.ok) throw new Error("Failed to generate keyframes");
        const data = await response.json();
        await sim(1100);
        const kfList = data.keyframes.split("• ").filter(Boolean).map(text => ({ text: text.trim(), image: null, isGenerating: false }));
        setKeyframes(kfList);
        setStep("keyframes");
        scrollToSection("section-keyframes");
        // auto-generate images for all keyframes
        autoGenerateKfImages(kfList);
      } else if (from === "keyframes") {
        const response = await fetch(`${API_BASE}/api/generate-video-generation-hook-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, storyboard, keyframes, script, selectedHook: selHook, hook: fields.hook, tone: fields.tone, audience: fields.audience }),
        });
        if (!response.ok) throw new Error("Failed to generate hook video prompt");
        const data = await response.json();
        await sim(1100);
        setVHook(data.videoHookPrompt);
        setStep("videoHook");
        scrollToSection("section-videoHook");
      } else if (from === "videoHook") {
        const response = await fetch(`${API_BASE}/api/generate-video-speaking-part`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, script, storyboard, keyframes, videoHookPrompt: vHook, selectedHook: selHook, hook: fields.hook, tone: fields.tone, audience: fields.audience }),
        });
        if (!response.ok) throw new Error("Failed to generate speaking video prompt");
        const data = await response.json();
        await sim(1100);
        setVSpeak(data.videoSpeakingPrompt);
        setStep("videoSpeak");
        scrollToSection("section-videoSpeak");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setStepLoading(null);
    }
  };

  const handleGenerateKfImage = async (idx) => {
    try {
      setKeyframes((prev) => prev.map((kf, i) => i === idx ? { ...kf, isGenerating: true } : kf));
      const kf = keyframes[idx];
      const references = fields.assets.length > 0 ? [fields.assets[0].dataUrl] : [];
      
      const payload = {
        model: "black-forest-labs/FLUX.1-schnell",
        prompt: kf.text,
        references: references,
      };

      const response = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Image generation failed");
      const data = await response.json();
      
      setKeyframes((prev) => prev.map((item, i) => i === idx ? { ...item, image: data.image, isGenerating: false } : item));
    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
      setKeyframes((prev) => prev.map((item, i) => i === idx ? { ...item, isGenerating: false } : item));
    }
  };

  const handleEdit = async (key, editInstruction) => {
    try {
      setEditLoading((prev) => ({ ...prev, [key]: true }));
      const contentMap = {
        hooks: marketingHooks.join("\n"),
        script: script,
        keyframes: keyframes.map(k => k.text).join("\n\n"),
        storyboard: Array.isArray(storyboard) ? storyboard.join("\n\n") : storyboard,
        videoHook: vHook,
        videoSpeak: vSpeak,
      };
      const response = await fetch(`${API_BASE}/api/edit-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: { hooks: 0, script: 1, keyframes: 2, storyboard: 3, videoHook: 4, videoSpeak: 5 }[key],
          currentContent: contentMap[key],
          editInstruction, tone: fields.tone, audience: fields.audience,
          selectedHook: selHook, projectId,
        }),
      });
      if (!response.ok) throw new Error("Failed to edit section");
      const data = await response.json();
      if (key === "script") setScript(data.updatedContent);
      else if (key === "storyboard") {
        const scenes = data.updatedContent.split("\n\n").filter(Boolean);
        setStoryboard(scenes.length > 1 ? scenes : [data.updatedContent]);
      }
      else if (key === "videoHook") setVHook(data.updatedContent);
      else if (key === "videoSpeak") setVSpeak(data.updatedContent);
      else if (key === "keyframes") setKeyframes(data.updatedContent.split("• ").filter(Boolean).map(text => ({ text: text.trim(), image: null, isGenerating: false })));
      else if (key === "hooks") setMarketingHooks(data.updatedContent.split("\n").filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleEditKeyframe = async (index, instruction) => {
    if (!instruction.trim()) return;
    try {
      setKfEditLoading(true);
      const response = await fetch(`${API_BASE}/api/edit-keyframe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          index,
          currentText: keyframes[index]?.text || "",
          editInstruction: instruction,
        }),
      });
      if (!response.ok) throw new Error("Failed to edit keyframe");
      const data = await response.json();
      setKeyframes((prev) => prev.map((item, idx) => idx === index ? { ...item, text: data.updatedText } : item));
      setEditingKf(-1);
      setEditingKfText("");
    } catch (err) {
      console.error(err);
    } finally {
      setKfEditLoading(false);
    }
  };

  const handleKfImage = (idx) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) setKeyframes((prev) => prev.map((kf, i) => (i === idx ? { ...kf, image: URL.createObjectURL(file) } : kf)));
    };
    input.click();
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", minHeight: 0 }}>

      {/* ── COLUMN 1: Page Nav (own scroll) ── */}
      <div
        className="page-nav-wrapper"
        style={{
          width: 220, flexShrink: 0,
          height: "100%", overflowY: "auto",
          borderRight: "1px solid var(--border-color)",
          background: "var(--bg-primary)",
        }}
      >
        <PageNav visibleSteps={visibleSteps} />
      </div>

      {/* ── COLUMN 2: Main Content (own scroll via ref) ── */}
      <div ref={scrollRef} data-scroll-container style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto" }}>
        {/* StepBar sticky at top */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)" }}>
          <StepBar currentStep={step} />
        </div>

        <main style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "32px 24px 80px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
            <OutlineBtn onClick={() => setModelOpen(true)}>
              <ModelIcon /> Change Model
            </OutlineBtn>
            <OutlineBtn onClick={onOpenSettings}>
              <EditIcon /> Master Prompts
            </OutlineBtn>
          </div>

          {modelOpen && <ChangeModelModal onClose={() => setModelOpen(false)} />}

            {/* INPUT */}
            <div id="section-input">
              <FieldBox label="Project Inputs" noEdit>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Reel Hook</label>
                    <input
                      value={fields.hook}
                      onChange={(e) => setFields((f) => ({ ...f, hook: e.target.value }))}
                      placeholder="What's the central idea or hook for this reel?"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Tone</label>
                      <input
                        value={fields.tone}
                        onChange={(e) => setFields((f) => ({ ...f, tone: e.target.value }))}
                        placeholder="Playful, Bold, Serious…"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Audience</label>
                      <input
                        value={fields.audience}
                        onChange={(e) => setFields((f) => ({ ...f, audience: e.target.value }))}
                        placeholder="Who is this for?"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Assets</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{
                        border: "1.5px dashed var(--border-color)", borderRadius: "var(--radius-md)",
                        padding: "18px", textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        <ImageIcon /> <span>Attach images</span>
                      </div>
                      {fields.assets.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                          {fields.assets.map((asset, i) => (
                            <span key={i} style={{
                              fontSize: "0.75rem", background: "var(--bg-tertiary)",
                              border: "1px solid var(--border-color)", color: "var(--text-secondary)",
                              padding: "2px 8px", borderRadius: "var(--radius-sm)",
                              fontFamily: "var(--font-mono)",
                            }}>
                              {asset.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }}
                      onChange={(e) => {
                        Array.from(e.target.files).forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const dataUrl = reader.result;
                            setFields((f) => ({ ...f, assets: [...f.assets, { name: file.name, dataUrl }] }));
                            // Persist project input image to Supabase (fire-and-forget)
                            fetch(`${API_BASE}/api/save-image`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ image: dataUrl, source: "project_input", filename: file.name }),
                            }).catch(() => {});
                          };
                          reader.readAsDataURL(file);
                        });
                      }} />
                  </div>
                </div>
                <RowFlex>
                  <PrimaryBtn onClick={handleGenerateHooks} disabled={loadingHooks || !fields.hook.trim()}>
                    {loadingHooks ? <><SpinnerIcon /> Generating…</> : "Generate Hooks"}
                  </PrimaryBtn>
                </RowFlex>
              </FieldBox>
            </div>

            {/* HOOKS */}
            {visibleSteps.includes("hooks") && (
              <div id="section-hooks">
                <FieldBox label="Marketing Hook One-Liners" loading={editLoading["hooks"]} onEdit={(text) => handleEdit("hooks", text)}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                    Select one to continue
                  </p>
                  {marketingHooks.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setSelHook(h)}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "14px 16px", borderRadius: "var(--radius-md)", marginBottom: 6, fontSize: "0.875rem",
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        border: selHook === h ? "1.5px solid var(--accent)" : "1px solid var(--border-color)",
                        background: selHook === h ? "var(--bg-tertiary)" : "var(--bg-primary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                        border: selHook === h ? "1.5px solid var(--accent)" : "1.5px solid var(--border-color)",
                        background: selHook === h ? "var(--accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        {selHook === h && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {h}
                    </button>
                  ))}
                  {selHook && (
                    <RowFlex>
                      <PrimaryBtn onClick={handleGenerateScript} disabled={loadingScript}>
                        {loadingScript ? <><SpinnerIcon /> Generating Script…</> : "Generate Script"}
                      </PrimaryBtn>
                    </RowFlex>
                  )}
                </FieldBox>
              </div>
            )}

            {/* SCRIPT */}
            {visibleSteps.includes("script") && (
              <div id="section-script">
                <FieldBox label="Script" loading={editLoading["script"]} onEdit={(text) => handleEdit("script", text)}>
                  <ContentBg>{script}</ContentBg>
                  <RowFlex>
                    <PrimaryBtn onClick={() => handleNext("script")} disabled={stepLoading === "script"}>
                      {stepLoading === "script" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </PrimaryBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* STORYBOARD */}
            {visibleSteps.includes("storyboard") && (
              <div id="section-storyboard">
                <FieldBox label="Storyboard Prompt" loading={editLoading["storyboard"]} onEdit={(text) => handleEdit("storyboard", text)}>
                  {(storyboard || []).map((scene, i) => (
                    <div key={i} style={{
                      background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
                      padding: 14, border: "1px solid var(--border-color)", marginBottom: 8,
                    }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                        Scene {i + 1}
                      </span>
                      <div style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{scene}</div>
                    </div>
                  ))}
                  <RowFlex>
                    <PrimaryBtn onClick={() => handleNext("storyboard")} disabled={stepLoading === "storyboard"}>
                      {stepLoading === "storyboard" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </PrimaryBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* KEYFRAMES */}
            {visibleSteps.includes("keyframes") && (
              <div id="section-keyframes">
                <FieldBox label="Keyframe Prompts" loading={editLoading["keyframes"]} onEdit={(text) => handleEdit("keyframes", text)}>
                  {keyframes.map((kf, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 16, alignItems: "flex-start",
                      background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
                      padding: 14, border: "1px solid var(--border-color)", marginBottom: 8,
                    }}>
                      <div
                        onClick={() => handleKfImage(i)}
                        style={{
                          width: 80, height: 80, flexShrink: 0, borderRadius: "var(--radius-md)",
                          border: "1.5px dashed var(--border-color)", display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", cursor: "pointer",
                          transition: "all 0.15s", color: "var(--text-muted)", overflow: "hidden",
                          background: "var(--bg-primary)", position: "relative"
                        }}
                        onMouseEnter={(e) => { if (!kf.image && !kf.isGenerating) { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                        onMouseLeave={(e) => { if (!kf.image && !kf.isGenerating) { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-muted)"; } }}
                      >
                        {kf.isGenerating ? (
                           <SpinnerIcon />
                        ) : kf.image ? (
                           <img src={kf.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                           <><ImageIcon /><span style={{ fontSize: "0.65rem", marginTop: 4, fontFamily: "var(--font-mono)", fontWeight: 600 }}>Upload</span></>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                            Frame {i + 1}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => { setEditingKf(i); setEditingKfText(""); }}
                              style={{
                                fontSize: "0.7rem", padding: "4px 8px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-color)", background: "var(--bg-primary)",
                                color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                              }}
                            >
                              <EditIcon /> Edit
                            </button>
                            <button
                              onClick={() => handleGenerateKfImage(i)}
                              disabled={kf.isGenerating}
                              style={{
                                fontSize: "0.7rem", padding: "4px 8px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-color)", background: "var(--bg-primary)",
                                color: "var(--text-primary)", cursor: kf.isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 4
                              }}
                            >
                              {kf.isGenerating ? <SpinnerIcon size={12} /> : <ImageIcon size={12} />}
                              Generate
                            </button>
                          </div>
                        </div>
                        {editingKf === i ? (
                          <div style={{ marginTop: 8 }}>
                            <input
                              value={editingKfText}
                              onChange={(e) => setEditingKfText(e.target.value)}
                              placeholder="Describe what to change in this keyframe…"
                              style={{
                                width: "100%", padding: "8px 12px", fontSize: "0.85rem",
                                borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                                background: "var(--bg-primary)", color: "var(--text-primary)",
                                fontFamily: "inherit", boxSizing: "border-box",
                              }}
                            />
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <button
                                onClick={() => handleEditKeyframe(i, editingKfText)}
                                disabled={kfEditLoading || !editingKfText.trim()}
                                style={{
                                  padding: "4px 12px", borderRadius: "var(--radius-sm)", border: "none",
                                  background: "var(--accent)", color: "#fff", cursor: "pointer",
                                  fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4,
                                  opacity: (kfEditLoading || !editingKfText.trim()) ? 0.6 : 1,
                                }}
                              >
                                {kfEditLoading ? <SpinnerIcon size={12} /> : <SendIcon />}
                                {kfEditLoading ? "Editing…" : "Send"}
                              </button>
                              <button
                                onClick={() => setEditingKf(-1)}
                                disabled={kfEditLoading}
                                style={{
                                  padding: "4px 12px", borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-color)", background: "var(--bg-primary)",
                                  color: "var(--text-primary)", cursor: "pointer", fontSize: "0.8rem",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--text-primary)", marginTop: 4, fontFamily: "inherit" }}>{kf.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <RowFlex>
                    <PrimaryBtn onClick={() => handleNext("keyframes")} disabled={stepLoading === "keyframes"}>
                      {stepLoading === "keyframes" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </PrimaryBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* VIDEO HOOK */}
            {visibleSteps.includes("videoHook") && (
              <div id="section-videoHook">
                <FieldBox label="Video Generation Hook Prompt" loading={editLoading["videoHook"]} onEdit={(text) => handleEdit("videoHook", text)}>
                  <ContentBg mono>{vHook}</ContentBg>
                  <RowFlex>
                    <PrimaryBtn onClick={() => handleNext("videoHook")} disabled={stepLoading === "videoHook"}>
                      {stepLoading === "videoHook" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </PrimaryBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* VIDEO SPEAK */}
            {visibleSteps.includes("videoSpeak") && (
              <div id="section-videoSpeak">
                <FieldBox label="Video Generation Speaking Part" loading={editLoading["videoSpeak"]} onEdit={(text) => handleEdit("videoSpeak", text)}>
                  <ContentBg mono>{vSpeak}</ContentBg>
                  <RowFlex extraStyle={{ gap: 16 }}>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-mono)",
                      letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)",
                    }}>
                      All steps complete
                    </span>
                    <span style={{
                      display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem",
                      fontWeight: 600, color: "var(--text-primary)",
                      background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
                      padding: "6px 12px", borderRadius: "var(--radius-md)",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Ready to export
                    </span>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            <div ref={bottomRef} />
          </main>
      </div>

      {/* ── COLUMN 3: Chat Panel (own scroll) ── */}
      <aside style={{
        width: isChatCollapsed ? "52px" : "380px",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        borderLeft: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        <WebLLMChatPanel isCollapsed={isChatCollapsed} onToggleCollapse={() => setIsChatCollapsed(c => !c)} />
      </aside>
    </div>
  );
}

// ── Past Project Detail ─────────────────────────────────────────────────────────
function PastProjectDetail({ project, onBack }) {
  const [editLoading, setEditLoading] = useState({});
  const [localKeyframes, setLocalKeyframes] = useState(null);
  const [editingKf, setEditingKf] = useState(-1);
  const [editingKfText, setEditingKfText] = useState("");
  const [kfEditLoading, setKfEditLoading] = useState(false);
  const kf = localKeyframes ?? project.keyframes ?? [];

  const handleEditKeyframe = async (index, instruction) => {
    if (!instruction.trim()) return;
    try {
      setKfEditLoading(true);
      const response = await fetch(`${API_BASE}/api/edit-keyframe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          index,
          currentText: kf[index]?.text || "",
          editInstruction: instruction,
        }),
      });
      if (!response.ok) throw new Error("Failed to edit keyframe");
      const data = await response.json();
      const updated = kf.map((item, idx) => idx === index ? { ...item, text: data.updatedText } : item);
      setLocalKeyframes(updated);
      setEditingKf(-1);
      setEditingKfText("");
    } catch (err) {
      console.error(err);
    } finally {
      setKfEditLoading(false);
    }
  };

  const handleEdit = async (key) => {
    setEditLoading((prev) => ({ ...prev, [key]: true }));
    await sim(1500);
    setEditLoading((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px", height: "100%", overflowY: "auto" }}>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)",
          border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
          background: "transparent", cursor: "pointer", marginBottom: 24,
          fontFamily: "inherit", padding: "7px 14px", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        <ArrowLeftIcon /> Back to projects
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "inherit" }}>{project.hook}</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{project.date}</p>
        </div>
        <span style={{
          fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-mono)",
          textTransform: "uppercase", letterSpacing: "0.08em",
          background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
          color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "var(--radius-sm)",
        }}>
          {project.status}
        </span>
      </div>

      <FieldBox label="Project Inputs" noEdit>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20 }}>
          {[["Hook", project.hook], ["Tone", project.tone], ["Audience", project.audience]].map(([l, v]) => (
            <div key={l}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", fontFamily: "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
      </FieldBox>

      {project.marketingHooks?.length > 0 && (
        <FieldBox label="Marketing Hooks (All Generated)" loading={editLoading["hook"]} onEdit={() => handleEdit("hook")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {project.marketingHooks.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 14px", borderRadius: "var(--radius-md)",
                border: h === project.selectedHook ? "1.5px solid var(--accent)" : "1px solid var(--border-color)",
                background: h === project.selectedHook ? "var(--bg-tertiary)" : "transparent",
                fontSize: "0.875rem", lineHeight: 1.5,
              }}>
                <span style={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: "50%", marginTop: 2,
                  background: h === project.selectedHook ? "var(--accent)" : "var(--border-color)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "0.65rem", fontWeight: 700,
                }}>
                  {h === project.selectedHook ? "✓" : i + 1}
                </span>
                <span style={{ color: "var(--text-primary)" }}>{h}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 10, fontFamily: "var(--font-mono)" }}>
            ✓ <strong>Selected:</strong> "{project.selectedHook}"
          </p>
        </FieldBox>
      )}
      {(!project.marketingHooks || project.marketingHooks.length === 0) && project.selectedHook && (
        <FieldBox label="Selected Marketing Hook" loading={editLoading["hook"]} onEdit={() => handleEdit("hook")}>
          <p style={{ fontSize: "0.9rem", fontWeight: 500, fontStyle: "italic", color: "var(--text-primary)", fontFamily: "inherit" }}>"{project.selectedHook}"</p>
        </FieldBox>
      )}

      <FieldBox label="Script" loading={editLoading["script"]} onEdit={() => handleEdit("script")}>
        <ContentBg>{project.script}</ContentBg>
      </FieldBox>

      <FieldBox label="Storyboard Prompt" loading={editLoading["storyboard"]} onEdit={() => handleEdit("storyboard")}>
        {(Array.isArray(project.storyboard) ? project.storyboard : [project.storyboard].filter(Boolean)).map((scene, i) => (
          <div key={i} style={{
            background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
            padding: 14, border: "1px solid var(--border-color)", marginBottom: 8,
          }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Scene {i + 1}
            </span>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{scene}</div>
          </div>
        ))}
      </FieldBox>

      <FieldBox label="Keyframe Prompts" loading={editLoading["keyframes"]} onEdit={() => handleEdit("keyframes")}>
        {kf.map((kfItem, i) => (
          <div key={i} style={{
            display: "flex", gap: 16, alignItems: "flex-start",
            background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
            padding: 14, border: "1px solid var(--border-color)", marginBottom: 8,
          }}>
            <div style={{
              width: 80, height: 80, flexShrink: 0, borderRadius: "var(--radius-md)",
              border: "1.5px dashed var(--border-color)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "var(--text-muted)",
              background: "var(--bg-primary)",
            }}>
              <ImageIcon />
              <span style={{ fontSize: "0.65rem", marginTop: 4, fontFamily: "var(--font-mono)", fontWeight: 600 }}>Image</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  Frame {i + 1}
                </span>
                {editingKf !== i && (
                  <button
                    onClick={() => { setEditingKf(i); setEditingKfText(""); }}
                    style={{
                      fontSize: "0.7rem", padding: "4px 8px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)", background: "var(--bg-primary)",
                      color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    <EditIcon /> Edit
                  </button>
                )}
              </div>
              {editingKf === i ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    value={editingKfText}
                    onChange={(e) => setEditingKfText(e.target.value)}
                    placeholder="Describe what to change in this keyframe…"
                    style={{
                      width: "100%", padding: "8px 12px", fontSize: "0.85rem",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                      background: "var(--bg-primary)", color: "var(--text-primary)",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      onClick={() => handleEditKeyframe(i, editingKfText)}
                      disabled={kfEditLoading || !editingKfText.trim()}
                      style={{
                        padding: "4px 12px", borderRadius: "var(--radius-sm)", border: "none",
                        background: "var(--accent)", color: "#fff", cursor: "pointer",
                        fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4,
                        opacity: (kfEditLoading || !editingKfText.trim()) ? 0.6 : 1,
                      }}
                    >
                      {kfEditLoading ? <SpinnerIcon size={12} /> : <SendIcon />}
                      {kfEditLoading ? "Editing…" : "Send"}
                    </button>
                    <button
                      onClick={() => setEditingKf(-1)}
                      disabled={kfEditLoading}
                      style={{
                        padding: "4px 12px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)", background: "var(--bg-primary)",
                        color: "var(--text-primary)", cursor: "pointer", fontSize: "0.8rem",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--text-primary)", marginTop: 4, fontFamily: "inherit" }}>{kfItem.text}</p>
              )}
            </div>
          </div>
        ))}
      </FieldBox>

      <FieldBox label="Video Hook Prompt" loading={editLoading["videoHook"]} onEdit={() => handleEdit("videoHook")}>
        <ContentBg mono>{project.videoHook}</ContentBg>
      </FieldBox>

      <FieldBox label="Speaking Part Prompt" loading={editLoading["videoSpeak"]} onEdit={() => handleEdit("videoSpeak")}>
        <ContentBg mono>{project.videoSpeak}</ContentBg>
      </FieldBox>
    </main>
  );
}

// ── Past Projects List ──────────────────────────────────────────────────────────
function PastProjects() {
  const [selected, setSelected] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/get-projects`);
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleMigrate = async () => {
    if (!window.confirm("Migrate all projects from Notion to PostgreSQL? Existing projects will be skipped.")) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/migrate-from-notion`, { method: "POST" });
      const data = await res.json();
      setMigrateResult(data);
      // Refresh projects list
      const response = await fetch(`${API_BASE}/api/get-projects`);
      const pdata = await response.json();
      setProjects(pdata.projects || []);
    } catch (err) {
      setMigrateResult({ error: err.message });
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/api/delete-project/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (selected) return <PastProjectDetail project={selected} onBack={() => setSelected(null)} />;

  if (loading) {
    return (
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px", height: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <SpinnerIcon size={14} /> Loading projects…
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px", height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "inherit" }}>Past Projects</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? "s" : ""} found</p>
        </div>
        <button
          onClick={handleMigrate}
          disabled={migrating}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-mono)",
            padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
            background: migrating ? "var(--bg-tertiary)" : "transparent",
            color: migrating ? "var(--text-muted)" : "var(--text-secondary)", cursor: migrating ? "not-allowed" : "pointer",
          }}
          title="Migrate existing projects from Notion to PostgreSQL"
        >
          {migrating ? <SpinnerIcon size={12} /> : "↻"} Migrate from Notion
        </button>
      </div>
      {migrateResult && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: "var(--radius-md)",
          background: migrateResult.error ? "#fef2f2" : "#f0fdf4",
          border: migrateResult.error ? "1px solid #fecaca" : "1px solid #bbf7d0",
          color: migrateResult.error ? "#b91c1c" : "#15803d", fontSize: "0.85rem",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span>{migrateResult.error ? "✗" : "✓"}</span>
          <span>
            {migrateResult.error
              ? `Migration failed: ${migrateResult.error}`
              : `Migrated ${migrateResult.inserted} new project(s) from Notion (${migrateResult.skipped} already existed, ${migrateResult.total_in_notion} total in Notion).`
            }
          </span>
          <button onClick={() => setMigrateResult(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", color: "inherit" }}>✕</button>
        </div>
      )}
      {projects.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          border: "1px dashed var(--border-color)", borderRadius: "var(--radius-lg)",
          color: "var(--text-muted)", fontSize: "0.875rem",
        }}>
          No projects yet. Start a new project from the Current Project tab.
        </div>
      ) : (
        projects.map((p) => (
          <div
            key={p.id}
            style={{ position: "relative", marginBottom: 8 }}
            onMouseEnter={(e) => {
              e.currentTarget.querySelector(".delete-btn").style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.querySelector(".delete-btn").style.opacity = "0";
            }}
          >
            <button
              onClick={() => setSelected(p)}
              style={{
                width: "100%", textAlign: "left", background: "var(--bg-primary)",
                border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)",
                padding: "18px 20px", cursor: "pointer",
                transition: "all 0.15s", display: "block", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ paddingRight: 36 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "inherit" }}>{p.hook}</div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{p.date} · {p.tone} · {p.audience}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-mono)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)", padding: "3px 9px", borderRadius: "var(--radius-sm)",
                  }}>
                    {p.status}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}><ChevronRightIcon /></span>
                </div>
              </div>
            </button>

            {/* Delete button — fades in on card hover */}
            <button
              className="delete-btn"
              onClick={(e) => handleDelete(e, p.id)}
              title="Delete project"
              style={{
                position: "absolute", top: "50%", right: 52,
                transform: "translateY(-50%)",
                opacity: 0, transition: "opacity 0.15s, background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                color: deletingId === p.id ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: deletingId === p.id ? "wait" : "pointer",
                zIndex: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#dc2626"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-primary)"; e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              disabled={deletingId === p.id}
            >
              {deletingId === p.id ? <SpinnerIcon size={12} /> : <TrashIcon />}
            </button>
          </div>
        ))
      )}
    </main>
  );
}

// ── Style constants ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  color: "var(--text-primary)",
  background: "var(--bg-primary)",
  transition: "border 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  marginBottom: 6,
  fontFamily: "var(--font-mono)",
};

// ── Master Prompts Modal ────────────────────────────────────────────────────────
function MasterPromptsModal({ onClose }) {
  const [prompts, setPrompts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const uploadRefs = useRef({});

  useEffect(() => {
    fetch(`${API_BASE}/api/prompts`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.detail) throw new Error(data.detail);
        setPrompts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch prompts:", err);
        setError("Failed to load prompts from backend. Please ensure the backend is running and up-to-date.");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompts),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Save failed");
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
        <div style={{ position: "relative", background: "var(--bg-primary)", padding: 40, borderRadius: "var(--radius-lg)" }}>
          <SpinnerIcon size={24} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: "90%", maxWidth: 640, maxHeight: "85vh",
        background: "var(--bg-primary)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
        border: "1px solid var(--border-color)", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>Edit Master Prompts</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><CloseIcon /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {error ? (
            <div style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Customize the instructions sent to the AI for each generation step. Variables and output formatting rules are automatically appended by the system.
              </p>
              {["hooks", "script", "storyboard", "keyframes", "videoHook", "videoSpeak"].map(key => (
                <div key={key}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{FIELD_LABELS[key] || key}</label>
                    <button
                      onClick={() => uploadRefs.current[key]?.click()}
                      title="Upload .md file"
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)", background: "transparent",
                        color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <UploadIcon /> Upload .md
                    </button>
                    <input
                      ref={(el) => uploadRefs.current[key] = el}
                      type="file"
                      accept=".md,.txt"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                          setPrompts((prev) => ({ ...prev, [key]: "Optimizing…" }));
                          const res = await fetch(`${API_BASE}/api/optimize-md-prompt`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ field: FIELD_LABELS[key] || key, markdown: text }),
                          });
                          if (!res.ok) throw new Error("Optimization failed");
                          const data = await res.json();
                          setPrompts((prev) => ({ ...prev, [key]: data.prompt }));
                        } catch {
                          setPrompts((prev) => ({ ...prev, [key]: text }));
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <textarea
                    value={prompts[key] || ""}
                    onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
                    style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.5 }}
                  />
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--bg-secondary)" }}>
          <OutlineBtn onClick={onClose} disabled={saving}>Cancel</OutlineBtn>
          <PrimaryBtn onClick={handleSave} disabled={saving || !!error}>{saving ? "Saving..." : "Save Defaults"}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

function ChangeModelModal({ onClose }) {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/llm-config`)
      .then((r) => r.json())
      .then((data) => {
        if (data.endpoint) {
          setEndpoint(data.endpoint);
          setSelectedModel(data.model);
        }
      })
      .catch(() => {});
  }, []);

  const handleTest = async () => {
    if (!endpoint.trim() || !apiKey.trim()) return;
    setTesting(true);
    setError(null);
    setTested(false);
    try {
      const res = await fetch(`${API_BASE}/api/llm-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: endpoint.trim(), apiKey: apiKey.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Test failed");
      }
      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length > 0 && !data.models.includes(selectedModel)) {
        setSelectedModel(data.models[0]);
      }
      setTested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedModel) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/llm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: endpoint.trim(), apiKey: apiKey.trim(), model: selectedModel }),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: "90%", maxWidth: 480, maxHeight: "85vh",
        background: "var(--bg-primary)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
        border: "1px solid var(--border-color)", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>Change LLM Model</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><CloseIcon /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}
          <div>
            <label style={labelStyle}>API Endpoint</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.openai.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleTest}
            disabled={testing || !endpoint.trim() || !apiKey.trim()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 20px", borderRadius: "var(--radius-md)", border: "none",
              background: testing ? "var(--bg-tertiary)" : "var(--accent)",
              color: testing ? "var(--text-muted)" : "#fff",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {testing ? <><SpinnerIcon size={14} /> Testing…</> : <>Test &amp; List Models</>}
          </button>
          {tested && models.length > 0 && (
            <div>
              <label style={labelStyle}>Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          {tested && models.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No models found at this endpoint.</p>
          )}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--bg-secondary)" }}>
          <OutlineBtn onClick={onClose} disabled={saving}>Cancel</OutlineBtn>
          <PrimaryBtn onClick={handleSave} disabled={saving || !selectedModel}>{saving ? "Saving..." : "Save"}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ── App Root ────────────────────────────────────────────────────────────────────
export default function Studio() {
  const [tab, setTab] = useState("current");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "var(--bg-primary)", display: "flex" }}>
      <style>{`
        /* Sidebar visibility */
        .sidebar-desktop { display: none; height: 100vh; position: sticky; top: 0; flex-shrink: 0; }
        .mobile-header   { display: flex; }
        .page-nav-wrapper { display: none; }

        @media (min-width: 768px) {
          .sidebar-desktop  { display: block; }
          .mobile-header    { display: none; }
        }

        @media (min-width: 1100px) {
          .page-nav-wrapper { display: block; }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar tab={tab} setTab={setTab} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Settings Modal */}
      {settingsOpen && <MasterPromptsModal onClose={() => setSettingsOpen(false)} />}

      {/* Main area - must be overflow:hidden so children scroll independently */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Mobile top header */}
        <header className="mobile-header" style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)",
          height: 52, alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "var(--radius-sm)",
              background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Reel Studio</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "transparent", border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)", padding: "6px 8px",
              cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
          >
            <MenuIcon />
          </button>
        </header>

        {/* Page content - flex:1 + min-height:0 lets it shrink and scroll inside */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          {tab === "current" ? <CurrentProject onOpenSettings={() => setSettingsOpen(true)} /> : tab === "imageGen" ? <ImageGenerations /> : tab === "mediaReview" ? <MediaReview /> : tab === "history" ? <ImageHistory /> : <PastProjects />}
        </div>
      </div>
    </div>
  );
}
