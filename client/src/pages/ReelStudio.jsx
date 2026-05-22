import { useState, useRef, useCallback, useEffect } from "react";

// ── MongoDB palette ────────────────────────────────────────────────────────────
// --mg-green: #00ED64 | --mg-dark: #001E2B | --mg-mid: #1C2D38 | --mg-navy: #023430

const STEP_ORDER = ["input", "hooks", "script", "keyframes", "storyboard", "videoHook", "videoSpeak"];
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
  hooks: "Marketing Hook One-Liners",
  script: "Script",
  keyframes: "Keyframe Prompts",
  storyboard: "Storyboard Prompt",
  videoHook: "Video Generation Hook Prompt",
  videoSpeak: "Video Generation Speaking Part",
};

function sim(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SpinnerIcon({ size = 14 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#001E2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CheckGreenIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00ED64" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const LogoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#001E2B">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

// ── Shared components ─────────────────────────────────────────────────────────

function BlackBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: disabled ? "#dde1e7" : "#001E2B",
      color: disabled ? "#9aa3af" : "#00ED64",
      border: "none", borderRadius: 9, padding: "14px 28px",
      fontSize: "0.95rem", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", transition: "background 0.13s",
    }}>
      {children}
    </button>
  );
}

function GreenBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: disabled ? "#dde1e7" : "#00ED64",
      color: disabled ? "#9aa3af" : "#001E2B",
      border: "none", borderRadius: 9, padding: "14px 28px",
      fontSize: "0.95rem", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", transition: "background 0.13s",
    }}>
      {children}
    </button>
  );
}

function FieldBox({ label, noEdit = false, editKey, onEdit, loading, children }) {
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
    <div style={{
      marginBottom: 22, borderRadius: 14,
      border: "2px solid #e2e6ed", background: "#fff", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "2px solid #e2e6ed", background: "#f7f8fa",
      }}>
        <span style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: "#001E2B", fontFamily: "monospace" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.95rem", fontWeight: 700, color: "#00b84e" }}>
              <SpinnerIcon size={13} /> Regenerating…
            </span>
          )}
          {!noEdit && !loading && (
            <button
              onClick={handleEditToggle}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "0.95rem", fontWeight: 700, padding: "4px 11px",
                borderRadius: 7,
                border: editing ? "2px solid #00ED64" : "2px solid #e2e6ed",
                color: editing ? "#023430" : "#001E2B",
                background: editing ? "rgba(0,237,100,0.10)" : "transparent",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.13s",
              }}
            >
              <EditIcon /> Edit
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: "clamp(20px, 2vw, 40px)" }}>
        {children}
        {editing && (
          <div style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "center", borderTop: "2px solid #e2e6ed", paddingTop: 16 }}>
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe what to change…"
              style={{
                flex: 1, fontSize: "0.95rem", border: "2px solid #e2e6ed", borderRadius: 9,
                padding: "10px 14px", outline: "none", fontFamily: "inherit",
                color: "#001E2B", background: "#fff",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: "10px 12px", background: "#001E2B", color: "#00ED64",
                border: "none", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center",
              }}
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
    <div style={{ background: "#f7f8fa", borderRadius: 9, padding: "18px 20px", border: "2px solid #e2e6ed" }}>
      <p style={{
        fontSize: "0.95rem", lineHeight: 1.75,
        color: "#001E2B", whiteSpace: "pre-line", margin: 0,
        fontFamily: mono ? "monospace" : "Georgia, serif",
      }}>
        {children}
      </p>
    </div>
  );
}

function RowFlex({ children, extraStyle }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18, alignItems: "center", ...extraStyle }}>
      {children}
    </div>
  );
}

// ── Step Nav ──────────────────────────────────────────────────────────────────
function StepNav({ currentStep }) {
  const curIdx = STEP_ORDER.indexOf(currentStep);
  const scrollTo = (key) => document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{
      position: "sticky", top: 56, zIndex: 20,
      background: "#001E2B", borderBottom: "1.5px solid #1C2D38",
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      <div style={{
        width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", gap: 2, height: 44,
      }}>
        {STEP_ORDER.map((key, i) => {
          const idx = STEP_ORDER.indexOf(key);
          const isDone = idx < curIdx;
          const isActive = idx === curIdx;
          return (
            <span key={key} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={{ color: "#2e4455", fontSize: "0.95rem", margin: "0 2px", flexShrink: 0 }}>›</span>}
              <button
                onClick={() => scrollTo(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", borderRadius: 6, fontSize: "0.95rem", fontWeight: 700,
                  fontFamily: "monospace", letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", border: "none", whiteSpace: "nowrap",
                  background: isActive ? "rgba(0,237,100,0.10)" : isDone ? "transparent" : "transparent",
                  color: isActive ? "#00ED64" : isDone ? "#5be59a" : "#8a9aa5",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? "#00ED64" : isDone ? "#5be59a" : "#2e4455",
                  boxShadow: isActive ? "0 0 0 3px rgba(0,237,100,0.2)" : "none",
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

// ── Side Nav ──────────────────────────────────────────────────────────────────
function SideNav({ visibleSteps }) {
  const scrollTo = (key) => document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <aside style={{ width: 260, flexShrink: 0, position: "sticky", top: 112, height: "fit-content", alignSelf: "start" }}>
      <div>
        <p style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: "#8a9aa5", marginBottom: 10, fontFamily: "monospace" }}>
          Fields
        </p>
        <nav>
          {visibleSteps.map((key) => (
            <button
              key={key}
              onClick={() => scrollTo(key)}
              style={{
                width: "100%", textAlign: "left", fontSize: "0.95rem", fontWeight: 600,
                color: "#001E2B", padding: "7px 10px", borderRadius: 7, border: "none",
                cursor: "pointer", background: "transparent", transition: "all 0.13s",
                display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,237,100,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ED64", flexShrink: 0 }} />
              {FIELD_LABELS[key]}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// ── Current Project ───────────────────────────────────────────────────────────
function CurrentProject() {
  const [step, setStep] = useState("input");
  const [fields, setFields] = useState({ hook: "", tone: "", audience: "", assets: [] });
  const [selHook, setSelHook] = useState(null);
  const [script, setScript] = useState("");
  const [keyframes, setKeyframes] = useState([]);
  const [storyboard, setStoryboard] = useState("");
  const [marketingHooks, setMarketingHooks] = useState([]);
  const [vHook, setVHook] = useState("");
  const [vSpeak, setVSpeak] = useState("");
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [stepLoading, setStepLoading] = useState(null);
  const [editLoading, setEditLoading] = useState({});
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const curIdx = STEP_ORDER.indexOf(step);
  const visibleSteps = STEP_ORDER.slice(0, curIdx + 1);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const handleGenerateHooks = async () => {
    try {

      setLoadingHooks(true);

      const response = await fetch(
        "http://localhost:5678/webhook/generate-hooks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            hook: fields.hook,
            tone: fields.tone,
            audience: fields.audience
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate hooks");
      }

      const data = await response.json();

      console.log(data);

      setMarketingHooks(data.marketingHooks);
      setProjectId(data.projectId);

      await sim(1000);

      setStep("hooks");

      scrollBottom();

    } catch (error) {

      console.error(error);

    } finally {

      setLoadingHooks(false);

    }
  };

  const handleGenerateScript = async () => {

  try {

    setLoadingScript(true);

      const response = await fetch(
        "http://localhost:5678/webhook/generate-script",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            projectId,
            selectedHook: selHook,
            hook: fields.hook,
            tone: fields.tone,
            audience: fields.audience
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = await response.json();

      await sim(1200);

      setScript(data.script);

      setStep("script");

      scrollBottom();

    } catch (error) {

      console.error(error);

    } finally {

      setLoadingScript(false);

    }
  };

  const handleNext = async (from) => {

    try {

      setStepLoading(from);

      // =========================
      // KEYFRAMES
      // =========================

      if (from === "script") {

        const response = await fetch(
          "http://localhost:5678/webhook/generate-keyframe-prompts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              projectId,
              script,
              selectedHook: selHook,
              hook: fields.hook,
              tone: fields.tone,
              audience: fields.audience
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate keyframes");
        }

        const data = await response.json();

        await sim(1100);

        setKeyframes(
          data.keyframes
            .split("• ")
            .filter(Boolean)
            .map(text => ({
              text: text.trim(),
              image: null
            }))
        );
        console.log(data);

        setStep("keyframes");
      }

      // =========================
      // STORYBOARD
      // =========================

      else if (from === "keyframes") {

        const response = await fetch(
          "http://localhost:5678/webhook/generate-storyboard-prompt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              projectId,
              keyframes,
              script,
              selectedHook: selHook,
              hook: fields.hook,
              tone: fields.tone,
              audience: fields.audience
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate storyboard");
        }

        const data = await response.json();

        await sim(1100);

        setStoryboard(data.storyboard);

        setStep("storyboard");
      }

      // =========================
      // VIDEO HOOK PROMPT
      // =========================

      else if (from === "storyboard") {

        const response = await fetch(
          "http://localhost:5678/webhook/generate-video-generation-hook-prompt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              projectId,
              storyboard,
              keyframes,
              script,
              selectedHook: selHook,
              hook: fields.hook,
              tone: fields.tone,
              audience: fields.audience
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate hook video prompt");
        }

        const data = await response.json();

        await sim(1100);

        setVHook(data.videoHookPrompt);

        setStep("videoHook");
      }

      // =========================
      // VIDEO SPEAKING PROMPT
      // =========================

      else if (from === "videoHook") {

        const response = await fetch(
          "http://localhost:5678/webhook/generate-video-speaking-part",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              projectId,
              script,
              storyboard,
              keyframes,
              videoHookPrompt: vHook,
              selectedHook: selHook,
              hook: fields.hook,
              tone: fields.tone,
              audience: fields.audience
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate speaking video prompt");
        }

        const data = await response.json();

        await sim(1100);

        setVSpeak(data.videoSpeakingPrompt);

        setStep("videoSpeak");
      }

      scrollBottom();

    } catch (error) {

      console.error(error);

    } finally {

      setStepLoading(null);

    }
  };

  const handleEdit = async (key, editInstruction) => {
    try {
      setEditLoading((prev) => ({
        ...prev,
        [key]: true
      }));

      const contentMap = {
        hooks: marketingHooks.join("\n"),
        script: script,
        keyframes: keyframes
          .map(k => k.text)
          .join("\n\n"),
        storyboard: storyboard,
        videoHook: vHook,
        videoSpeak: vSpeak
      };

      const response = await fetch(
        "http://localhost:5678/webhook/edit-section",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            section: {
              hooks: 0,
              script: 1,
              keyframes: 2,
              storyboard: 3,
              videoHook: 4,
              videoSpeak: 5
            }[key],
            currentContent: contentMap[key],
            editInstruction,
            tone: fields.tone,
            audience: fields.audience,
            selectedHook: selHook,
            projectId
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to edit section");
      }

      const data = await response.json();

      if (key === "script") {
        setScript(data.updatedContent);

      } else if (key === "storyboard") {
        setStoryboard(data.updatedContent);

      } else if (key === "videoHook") {
        setVHook(data.updatedContent);

      } else if (key === "videoSpeak") {
        setVSpeak(data.updatedContent);

      } else if (key === "keyframes") {

        setKeyframes(
          data.updatedContent
            .split("• ")
            .filter(Boolean)
            .map(text => ({
              text: text.trim(),
              image: null
            }))
        );

      } else if (key === "hooks") {

        setMarketingHooks(
          data.updatedContent
            .split("\n")
            .filter(Boolean)
        );
      }

    } catch (err) {

      console.error(err);

    } finally {

      setEditLoading((prev) => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const handleKfImage = (idx) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setKeyframes((prev) =>
          prev.map((kf, i) => (i === idx ? { ...kf, image: URL.createObjectURL(file) } : kf))
        );
      }
    };
    input.click();
  };

  return (
    <>
      <StepNav currentStep={step} />
      <main
        style={{
          width: "100%",
          maxWidth: "1700px",
          margin: "0 auto",
          padding: "48px clamp(24px, 4vw, 72px) 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 1fr)",
            gap: "48px",
            width: "100%",
            alignItems: "start",
          }}
        >
          {/* Side nav — hidden on mobile via inline media won't work; use a wrapper div with class instead */}
          <SideNav visibleSteps={visibleSteps} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* INPUT */}
            <div id="section-input">
              <FieldBox label="Project Inputs" noEdit>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={labelStyle}>Reel Hook</label>
                    <input
                      value={fields.hook}
                      onChange={(e) => setFields((f) => ({ ...f, hook: e.target.value }))}
                      placeholder="What's the central idea or hook for this reel?"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                        border: "2px dashed #e2e6ed", borderRadius: 9, padding: 18,
                        textAlign: "center", cursor: "pointer", transition: "all 0.13s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ED64"; e.currentTarget.style.background = "rgba(0,237,100,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e6ed"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#8a9aa5", fontSize: "0.95rem", fontWeight: 600 }}>
                        <ImageIcon /> Attach images
                      </div>
                      {fields.assets.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                          {fields.assets.map((name, i) => (
                            <span key={i} style={{ fontSize: "0.95rem", background: "#fff", border: "2px solid #e2e6ed", color: "#001E2B", padding: "3px 9px", borderRadius: 6, fontFamily: "monospace", fontWeight: 700 }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setFields((f) => ({ ...f, assets: [...f.assets, ...Array.from(e.target.files).map((f) => f.name)] }))}
                    />
                  </div>
                </div>
                <RowFlex>
                  <BlackBtn onClick={handleGenerateHooks} disabled={loadingHooks || !fields.hook.trim()}>
                    {loadingHooks ? <><SpinnerIcon /> Generating…</> : "Generate Hooks"}
                  </BlackBtn>
                </RowFlex>
              </FieldBox>
            </div>

            {/* HOOKS */}
            {visibleSteps.includes("hooks") && (
              <div id="section-hooks">
                <FieldBox label="Marketing Hook One-Liners" loading={editLoading["hooks"]} onEdit={(text) => handleEdit("hooks", text)}>
                  <p style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a9aa5", marginBottom: 14 }}>
                    Select one to continue
                  </p>
                  {marketingHooks.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setSelHook(h)}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "16px 18px", borderRadius: 9, marginBottom: 7, fontSize: "0.95rem",
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.13s",
                        border: selHook === h ? "2px solid #00ED64" : "2px solid #e2e6ed",
                        background: selHook === h ? "rgba(0,237,100,0.10)" : "#fff",
                        color: "#001E2B",
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                        border: selHook === h ? "2px solid #00ED64" : "2px solid #c8cdd5",
                        background: selHook === h ? "#00ED64" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.13s",
                      }}>
                        {selHook === h && <CheckIcon />}
                      </span>
                      {h}
                    </button>
                  ))}
                  {selHook && (
                    <RowFlex>
                      <GreenBtn onClick={handleGenerateScript} disabled={loadingScript}>
                        {loadingScript ? <><SpinnerIcon /> Generating Script…</> : "Generate Script"}
                      </GreenBtn>
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
                    <GreenBtn onClick={() => handleNext("script")} disabled={stepLoading === "script"}>
                      {stepLoading === "script" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </GreenBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* KEYFRAMES */}
            {visibleSteps.includes("keyframes") && (
              <div id="section-keyframes">
                <FieldBox label="Keyframe Prompts" loading={editLoading["keyframes"]} onEdit={(text) => handleEdit("keyframes", text)}>
                  {keyframes.map((kf, i) => (
                    <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: "#f7f8fa", borderRadius: 9, padding: 14, border: "2px solid #e2e6ed", marginBottom: 10 }}>
                      <div
                        onClick={() => handleKfImage(i)}
                        style={{
                          width: 88, height: 88, flexShrink: 0, borderRadius: 9,
                          border: "2px dashed #c8cdd5", display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", cursor: "pointer",
                          transition: "all 0.13s", color: "#8a9aa5", overflow: "hidden",
                        }}
                        onMouseEnter={(e) => { if (!kf.image) { e.currentTarget.style.borderColor = "#00ED64"; e.currentTarget.style.color = "#00ED64"; e.currentTarget.style.background = "rgba(0,237,100,0.06)"; } }}
                        onMouseLeave={(e) => { if (!kf.image) { e.currentTarget.style.borderColor = "#c8cdd5"; e.currentTarget.style.color = "#8a9aa5"; e.currentTarget.style.background = "transparent"; } }}
                      >
                        {kf.image
                          ? <img src={kf.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <><ImageIcon /><span style={{ fontSize: "0.95rem", marginTop: 4, fontFamily: "monospace", fontWeight: 800 }}>Image</span></>
                        }
                      </div>
                      <div>
                        <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9aa5" }}>
                          Frame {i + 1}
                        </span>
                        <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "#001E2B", marginTop: 5, fontFamily: "inherit" }}>{kf.text}</p>
                      </div>
                    </div>
                  ))}
                  <RowFlex>
                    <GreenBtn
                      onClick={() => handleNext("keyframes")}
                      disabled={stepLoading === "keyframes"}
                    >
                      {stepLoading === "keyframes"
                        ? <><SpinnerIcon /> Loading…</>
                        : <>Next <ChevronRightIcon /></>}
                    </GreenBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* STORYBOARD */}
            {visibleSteps.includes("storyboard") && (
              <div id="section-storyboard">
                <FieldBox label="Storyboard Prompt" loading={editLoading["storyboard"]} onEdit={(text) => handleEdit("storyboard", text)}>
                  <ContentBg>{storyboard}</ContentBg>
                  <RowFlex>
                    <GreenBtn onClick={() => handleNext("storyboard")} disabled={stepLoading === "storyboard"}>
                      {stepLoading === "storyboard" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </GreenBtn>
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
                    <GreenBtn onClick={() => handleNext("videoHook")} disabled={stepLoading === "videoHook"}>
                      {stepLoading === "videoHook" ? <><SpinnerIcon /> Loading…</> : <>Next <ChevronRightIcon /></>}
                    </GreenBtn>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            {/* VIDEO SPEAK */}
            {visibleSteps.includes("videoSpeak") && (
              <div id="section-videoSpeak">
                <FieldBox label="Video Generation Speaking Part" loading={editLoading["videoSpeak"]} onEdit={(text) => handleEdit("videoSpeak", text)}>
                  <ContentBg mono>{vSpeak}</ContentBg>
                  <RowFlex extraStyle={{ gap: 24 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a9aa5" }}>
                      All fields complete
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.95rem", fontWeight: 700, color: "#00b84e", background: "rgba(0,237,100,0.10)", padding: "7px 14px", borderRadius: 8 }}>
                      <CheckGreenIcon /> Ready to export
                    </span>
                  </RowFlex>
                </FieldBox>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </main>
    </>
  );
}

// ── Past Project Detail ───────────────────────────────────────────────────────
function PastProjectDetail({ project, onBack }) {
  const [editLoading, setEditLoading] = useState({});

  const handleEdit = async (key) => {
    setEditLoading((prev) => ({ ...prev, [key]: true }));
    await sim(1500); // PLACEHOLDER: backend regenerate call
    setEditLoading((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <main style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "36px 24px 60px" }}>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: "0.95rem", fontWeight: 700, color: "#001E2B", border: "none",
          background: "transparent", cursor: "pointer", marginBottom: 24,
          fontFamily: "inherit", padding: 0, transition: "color 0.13s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#00b84e"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#001E2B"; }}
      >
        <ArrowLeftIcon /> Back to projects
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#001E2B", fontFamily: "inherit" }}>{project.hook}</h2>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#8a9aa5", fontFamily: "monospace", marginTop: 5 }}>{project.date}</p>
        </div>
        <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(0,237,100,0.10)", color: "#00b84e", padding: "5px 12px", borderRadius: 20 }}>
          {project.status}
        </span>
      </div>

      <FieldBox label="Project Inputs" noEdit>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[["Hook", project.hook], ["Tone", project.tone], ["Audience", project.audience]].map(([l, v]) => (
            <div key={l}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9aa5", display: "block", marginBottom: 5 }}>{l}</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#001E2B", fontFamily: "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
      </FieldBox>

      <FieldBox label="Selected Marketing Hook" loading={editLoading["hook"]} onEdit={() => handleEdit("hook")}>
        <p style={{ fontSize: "0.95rem", fontWeight: 600, fontStyle: "italic", color: "#001E2B", fontFamily: "inherit" }}>"{project.selectedHook}"</p>
      </FieldBox>

      <FieldBox label="Script" loading={editLoading["script"]} onEdit={() => handleEdit("script")}>
        <ContentBg>{project.script}</ContentBg>
      </FieldBox>

      <FieldBox label="Keyframe Prompts" loading={editLoading["keyframes"]} onEdit={() => handleEdit("keyframes")}>
        {project.keyframes.map((kf, i) => (
          <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: "#f7f8fa", borderRadius: 9, padding: 14, border: "2px solid #e2e6ed", marginBottom: 10 }}>
            <div style={{ width: 88, height: 88, flexShrink: 0, borderRadius: 9, border: "2px dashed #c8cdd5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8a9aa5" }}>
              <ImageIcon />
              <span style={{ fontSize: "0.95rem", marginTop: 4, fontFamily: "monospace", fontWeight: 800 }}>Image</span>
            </div>
            <div>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9aa5" }}>Frame {i + 1}</span>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "#001E2B", marginTop: 5, fontFamily: "inherit" }}>{kf.text}</p>
            </div>
          </div>
        ))}
      </FieldBox>

      <FieldBox label="Storyboard Prompt" loading={editLoading["storyboard"]} onEdit={() => handleEdit("storyboard")}>
        <ContentBg>{project.storyboard}</ContentBg>
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

// ── Past Projects List ────────────────────────────────────────────────────────
function PastProjects() {
  const [selected, setSelected] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProjects = async () => {

      try {

        const response = await fetch(
          "http://localhost:5678/webhook/get-projects"
        );

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

  if (selected) {
    return <PastProjectDetail project={selected} onBack={() => setSelected(null)} />;
  }

  if (loading) {
    return (
      <main style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "36px 24px 60px"
      }}>
        <p>Loading projects...</p>
      </main>
    );
  }

  return (
    <main style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "36px 24px 60px" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#001E2B", fontFamily: "inherit", marginBottom: 28 }}>Past Projects</h2>
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelected(p)}
          style={{
            width: "100%", textAlign: "left", background: "#fff",
            border: "2px solid #e2e6ed", borderRadius: 14,
            padding: "20px 24px", cursor: "pointer", marginBottom: 10,
            transition: "all 0.15s", display: "block", fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00ED64"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,237,100,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e6ed"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#001E2B", fontFamily: "inherit" }}>{p.hook}</div>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "monospace", color: "#8a9aa5", marginTop: 4 }}>{p.date} · {p.tone} · {p.audience}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(0,237,100,0.10)", color: "#00b84e", padding: "5px 12px", borderRadius: 20 }}>{p.status}</span>
              <span style={{ color: "#c8cdd5" }}><ChevronRightIcon /></span>
            </div>
          </div>
        </button>
      ))}
    </main>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", border: "2px solid #e2e6ed", borderRadius: 9,
  padding: "16px 18px", fontSize: "0.95rem", outline: "none", fontFamily: "inherit",
  color: "#001E2B", background: "#fff", transition: "border 0.13s",
  boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.13em",
  textTransform: "uppercase", color: "#001E2B", marginBottom: 7, fontFamily: "monospace",
};

// ── App Root ──────────────────────────────────────────────────────────────────
export default function Studio() {
  const [tab, setTab] = useState("current");

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 15px; }
        body { font-family: -apple-system, 'Helvetica Neue', sans-serif; }
        input:focus { border-color: #00ED64 !important; box-shadow: 0 0 0 3px rgba(0,237,100,0.12); }
        button { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "#001E2B", borderBottom: "2px solid #1C2D38",
      }}>
        <div style={{
          width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "0 24px",
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#00ED64", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoIcon />
            </div>
          </div>

          {/* Tab nav */}
          <nav style={{ display: "flex", gap: 2, background: "#1C2D38", border: "1.5px solid #2e4455", padding: 3, borderRadius: 9 }}>
            {[{ key: "current", label: "Current Project" }, { key: "past", label: "Past Projects" }].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontSize: "0.95rem", fontWeight: 700, padding: "6px 18px", borderRadius: 7,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: tab === t.key ? "#00ED64" : "transparent",
                  color: tab === t.key ? "#001E2B" : "#8a9aa5",
                  fontFamily: "inherit",
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Avatar */}
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#00ED64", color: "#001E2B", fontSize: "0.95rem", fontWeight: 800, fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>
            AG
          </div>
        </div>
      </header>

      {tab === "current" ? <CurrentProject /> : <PastProjects />}
    </div>
  );
}
