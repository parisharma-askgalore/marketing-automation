import { useState, useRef, useEffect } from "react";

export default function WebLLMChatPanel({ isCollapsed, onToggleCollapse }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your cloud-powered AI assistant (via Groq). How can I help you brainstorm prompts or refine ideas today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("groq_api_key") || "");
  const [showSettings, setShowSettings] = useState(!localStorage.getItem("groq_api_key"));
  const [model, setModel] = useState("llama-3.1-8b-instant");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveSettings = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      localStorage.setItem("groq_api_key", apiKeyInput.trim());
      setShowSettings(false);
    }
  };

  const clearApiKey = () => {
    setApiKey("");
    setApiKeyInput("");
    localStorage.removeItem("groq_api_key");
    setShowSettings(true);
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;
    
    const userMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch from Groq API");
      }

      const reply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}. Check your API key.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCollapsed) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid var(--border-color)", padding: "0 10px", background: "var(--bg-primary)" }}>
        <button 
          onClick={onToggleCollapse}
          style={{
            background: "var(--accent)", border: "none", borderRadius: "var(--radius-lg)",
            padding: "24px 12px", cursor: "pointer", color: "#fff", writingMode: "vertical-rl", textOrientation: "mixed", letterSpacing: 2,
            fontWeight: 800, fontSize: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "transform 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          ◂ OPEN AI CHAT
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", width: 350,
      background: "var(--bg-primary)", borderLeft: "1px solid var(--border-color)", overflow: "hidden"
    }}>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
          Cloud AI Chat (Groq)
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }} title="Settings">⚙️</button>
          <button 
            onClick={onToggleCollapse} 
            style={{ 
              background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
              padding: "6px 12px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 4, boxShadow: "var(--shadow-sm)"
            }} 
            title="Collapse Chat"
          >
            Collapse ▸
          </button>
        </div>
      </div>

      {showSettings ? (
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>API Settings</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            To save local RAM, we use Groq's extremely fast, free cloud API. Get your free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>console.groq.com</a>.
          </p>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 8 }}>Groq API Key</label>
            <input 
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 8 }}>Model Selection</label>
            <select 
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            >
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast, standard)</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (High quality)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B (Large context)</option>
              <option value="gemma2-9b-it">Gemma 2 9B (Google)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={handleSaveSettings}
              style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600 }}
            >
              Save Settings
            </button>
            {apiKey && (
              <button 
                onClick={clearApiKey}
                style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-color)", padding: "8px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600 }}
              >
                Clear Key
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "var(--accent)" : "var(--bg-tertiary)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                padding: "10px 14px", borderRadius: "var(--radius-md)",
                maxWidth: "85%", fontSize: "0.85rem", lineHeight: 1.5,
                border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none"
              }}>
                <div style={{ fontSize: "0.65rem", opacity: 0.7, marginBottom: 4, textTransform: "uppercase" }}>{msg.role}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
               <div style={{ alignSelf: "flex-start", background: "var(--bg-tertiary)", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                 <span style={{ animation: "pulse 1.5s infinite" }}>Thinking...</span>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask for prompt ideas..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.85rem"
                }}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)",
                  padding: "0 16px", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", opacity: isLoading || !input.trim() ? 0.7 : 1
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
