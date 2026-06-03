import { useState, useRef, useEffect } from "react";
import * as webllm from "@mlc-ai/web-llm";

export default function WebLLMChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [engine, setEngine] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initProgress, setInitProgress] = useState("");
  const [isReady, setIsReady] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC"; // Standard good model, free local

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initEngine = async () => {
    try {
      setIsLoading(true);
      setInitProgress("Initializing WebLLM Engine...");
      
      const initProgressCallback = (report) => {
        setInitProgress(`Loading: ${Math.round(report.progress * 100)}% - ${report.text}`);
      };

      const newEngine = await webllm.CreateMLCEngine(
        selectedModel,
        { initProgressCallback }
      );
      
      setEngine(newEngine);
      setIsReady(true);
      setInitProgress("");
      setMessages([{ role: "assistant", content: "Hello! I am your local AI assistant running directly in your browser. How can I help you brainstorm prompts or refine ideas today?" }]);
    } catch (err) {
      console.error("Failed to init WebLLM:", err);
      setInitProgress("Error initializing AI. Check console or try reloading.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !engine) return;
    
    const userMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const chunks = await engine.chat.completions.create({
        messages: updatedMessages,
        stream: true,
      });

      let reply = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of chunks) {
        reply += chunk.choices[0]?.delta?.content || "";
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].content = reply;
          return newMsg;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "An error occurred while generating the response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--bg-primary)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-color)", overflow: "hidden"
    }}>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
          Local AI Chat (WebLLM)
        </span>
        <span style={{ fontSize: "0.7rem", color: isReady ? "#10b981" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isReady ? "#10b981" : "var(--text-muted)" }} />
          {isReady ? "Ready" : "Offline"}
        </span>
      </div>

      {!isReady ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" color="var(--text-muted)" style={{ marginBottom: 16 }}>
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
          </svg>
          <h3 style={{ fontSize: "1rem", marginBottom: 8, color: "var(--text-primary)" }}>Local AI Assistant</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 20 }}>
            Run an AI model directly in your browser for absolute privacy. No API keys required. First run will download the model.
          </p>
          <button 
            onClick={initEngine} 
            disabled={isLoading}
            style={{
              background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "var(--radius-md)",
              cursor: isLoading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.85rem", opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "Initializing..." : "Load AI Engine"}
          </button>
          {initProgress && <div style={{ marginTop: 16, fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{initProgress}</div>}
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
