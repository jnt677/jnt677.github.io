const { useEffect, useMemo, useRef, useState } = React;

const API_URL =
  "https://jezjupxysmctthvkrnpx.supabase.co/functions/v1/jnt-wa-api";

function getText(value) {
  if (typeof value === "string") return value;
  if (!value) return "";
  if (value.caption) return value.caption;
  if (value.text?.body) return value.text.body;
  if (value.body) return value.body;
  if (value.type === "image") return "📷 Image";
  if (value.type === "video") return "🎥 Video";
  if (value.type === "audio") return "🎵 Audio";
  if (value.type === "document") return "📄 Document";
  try { return JSON.stringify(value); } catch { return ""; }
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function normalizeChats(data) {
  if (!data) return {};
  if (!Array.isArray(data)) return data;
  return data.reduce((groups, item) => {
    const id = item.chat_id || item.wa_id || item.subscriber_id || "unknown";
    (groups[id] ||= []).push(item);
    return groups;
  }, {});
}

function App() {
  const [chats, setChats] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const sourceRef = useRef(null);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const delayRef = useRef(2000);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}?limit=50`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((result) => {
        if (!result.success) throw new Error(result.error || "Gagal mengambil data");
        if (cancelled) return;
        const normalized = normalizeChats(result.data);
        setChats(normalized);
        const ids = Object.keys(normalized);
        if (ids.length) setSelectedChatId(ids[0]);
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Gagal mengambil data"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) return;
      setStatus("connecting");
      const source = new EventSource(`${API_URL}?realtime=true`);
      sourceRef.current = source;

      const connected = () => {
        setStatus("connected");
        delayRef.current = 2000;
      };
      source.addEventListener("connected", connected);
      source.addEventListener("ready", connected);

      source.onmessage = (event) => {
        try {
          const item = JSON.parse(event.data);
          const chatId = item.chat_id || item.wa_id || item.subscriber_id;
          if (!chatId || !item.wa_message_id) return;

          const message = {
            ...item,
            role: item.role || (item.agent_name?.trim() ? "me" : "contact")
          };

          setChats((current) => {
            const existing = current[chatId] || [];
            if (existing.some((m) => m.wa_message_id === message.wa_message_id)) return current;
            return { ...current, [chatId]: [message, ...existing] };
          });
          setSelectedChatId((current) => current || chatId);
        } catch (e) {
          console.error("SSE message error", e);
        }
      };

      source.onerror = () => {
        if (stoppedRef.current) return;
        source.close();
        setStatus("reconnecting");
        const delay = delayRef.current;
        delayRef.current = Math.min(delay * 2, 10000);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      stoppedRef.current = true;
      clearTimeout(timerRef.current);
      sourceRef.current?.close();
    };
  }, []);

  const selectedMessages = useMemo(
    () => (selectedChatId ? chats[selectedChatId] || [] : []),
    [chats, selectedChatId]
  );
  const chatIds = Object.keys(chats);
  const statusText = {
    connected: "Realtime Connected",
    connecting: "Connecting...",
    reconnecting: "Reconnecting..."
  }[status] || "Disconnected";

  if (loading) return <div style={styles.center}>Loading messages...</div>;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.title}>J&T WhatsApp</div>
        <div style={styles.status}>
          <span style={{ ...styles.dot, background: status === "connected" ? "#22c55e" : "#f59e0b" }} />
          {statusText}
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Conversations ({chatIds.length})</div>
          {chatIds.length === 0 && <div style={styles.empty}>No conversations</div>}
          {chatIds.map((chatId) => {
            const messages = chats[chatId] || [];
            const last = messages[0];
            return (
              <button key={chatId} onClick={() => setSelectedChatId(chatId)}
                style={{ ...styles.chatItem, ...(selectedChatId === chatId ? styles.active : {}) }}>
                <div style={styles.chatName}>{last?.first_name || chatId}</div>
                <div style={styles.preview}>{getText(last?.user_message ?? last?.message)}</div>
                <div style={styles.time}>{formatTime(last?.created_at)}</div>
              </button>
            );
          })}
        </aside>

        <main style={styles.chat}>
          {!selectedChatId ? (
            <div style={styles.center}>Select a conversation</div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <strong>{selectedMessages[0]?.first_name || selectedChatId}</strong>
                <small>{selectedChatId}</small>
              </div>
              <div style={styles.messages}>
                {selectedMessages.length === 0 ? <div style={styles.center}>No messages</div> :
                  selectedMessages.slice().reverse().map((message) => {
                    const mine = message.role === "me" || message.agent_name?.trim();
                    return (
                      <div key={message.wa_message_id} style={{ ...styles.row, justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <div style={{ ...styles.bubble, ...(mine ? styles.myBubble : styles.contactBubble) }}>
                          <div style={styles.message}>{getText(message.user_message ?? message.message)}</div>
                          <div style={styles.messageTime}>{formatTime(message.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  app: { width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", color: "#111", background: "#fff" },
  header: { padding: "16px", borderBottom: "1px solid #ddd", flexShrink: 0 },
  title: { fontSize: "18px", fontWeight: "700" },
  status: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#666", marginTop: "5px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" },
  content: { flex: 1, minHeight: 0, display: "flex" },
  sidebar: { width: "300px", flexShrink: 0, borderRight: "1px solid #ddd", overflowY: "auto" },
  sidebarTitle: { padding: "14px", fontWeight: "700", borderBottom: "1px solid #eee" },
  chatItem: { width: "100%", border: 0, borderBottom: "1px solid #eee", background: "#fff", padding: "12px", textAlign: "left", cursor: "pointer" },
  active: { background: "#f1f1f1" },
  chatName: { fontWeight: "700", marginBottom: "4px" },
  preview: { fontSize: "13px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  time: { fontSize: "11px", color: "#999", marginTop: "5px" },
  chat: { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" },
  chatHeader: { padding: "14px", borderBottom: "1px solid #ddd", display: "flex", flexDirection: "column", flexShrink: 0 },
  messages: { flex: 1, overflowY: "auto", padding: "16px" },
  row: { display: "flex", marginBottom: "8px" },
  bubble: { maxWidth: "75%", padding: "9px 12px", borderRadius: "10px" },
  myBubble: { background: "#dcf8c6" },
  contactBubble: { background: "#f1f1f1" },
  message: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  messageTime: { fontSize: "10px", color: "#777", marginTop: "4px", textAlign: "right" },
  center: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif", color: "#666" },
  empty: { padding: "20px", color: "#777", textAlign: "center" },
  error: { padding: "10px 16px", background: "#fee2e2", color: "#991b1b", fontSize: "13px", flexShrink: 0 }
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
