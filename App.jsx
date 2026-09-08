const { useEffect, useMemo, useRef, useState } = React;

const API_URL =
  "https://jezjupxysmctthvkrnpx.supabase.co/functions/v1/jnt-wa-api";

function App() {
  const [chats, setChats] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState("");

  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const stoppedRef = useRef(false);
  const reconnectDelayRef = useRef(2000);

  const MAX_RECONNECT_DELAY = 10000;

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}?limit=50`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Gagal mengambil data");
        }

        if (!cancelled) {
          const data = result.data || {};
          setChats(data);

          const chatIds = Object.keys(data);
          if (chatIds.length > 0) {
            setSelectedChatId((current) => current || chatIds[0]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Gagal mengambil data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    stoppedRef.current = false;

    function connectSSE() {
      if (stoppedRef.current) return;

      setConnectionStatus("connecting");
      console.log("Connecting SSE...");

      const source = new EventSource(`${API_URL}?realtime=true`);
      eventSourceRef.current = source;

      source.addEventListener("connected", () => {
        console.log("SSE connected");
        setConnectionStatus("connected");
        reconnectDelayRef.current = 2000;
      });

      source.addEventListener("ready", () => {
        console.log("SSE realtime ready");
        setConnectionStatus("connected");
        reconnectDelayRef.current = 2000;
      });

      source.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);
          const chatId = incoming.chat_id;

          if (!chatId || !incoming.wa_message_id) {
            console.warn("SSE message tidak memiliki chat_id:", incoming);
            return;
          }

          const message = {
            wa_message_id: incoming.wa_message_id,
            role:
              incoming.role ||
              (incoming.agent_name?.trim() ? "me" : "contact"),
            agent_name: incoming.agent_name || "",
            first_name: incoming.first_name || "",
            user_message: incoming.user_message,
            whatsapp_bot_username: incoming.whatsapp_bot_username || "",
            created_at: incoming.created_at,
          };

          setChats((current) => {
            const existing = current[chatId] || [];

            if (
              existing.some(
                (item) => item.wa_message_id === message.wa_message_id
              )
            ) {
              return current;
            }

            return {
              ...current,
              [chatId]: [message, ...existing],
            };
          });

          setSelectedChatId((current) => current || chatId);
        } catch (err) {
          console.error("SSE message error:", err);
        }
      };

      source.onerror = () => {
        if (stoppedRef.current) return;

        console.warn(
          `SSE disconnected. Reconnecting in ${
            reconnectDelayRef.current / 1000
          } seconds...`
        );

        setConnectionStatus("reconnecting");
        source.close();

        if (eventSourceRef.current === source) {
          eventSourceRef.current = null;
        }

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        const delay = reconnectDelayRef.current;

        reconnectTimerRef.current = setTimeout(() => {
          if (stoppedRef.current) return;

          connectSSE();
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            MAX_RECONNECT_DELAY
          );
        }, delay);
      };
    }

    connectSSE();

    return () => {
      stoppedRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setConnectionStatus("disconnected");
    };
  }, []);

  const selectedMessages = useMemo(() => {
    if (!selectedChatId) return [];
    return chats[selectedChatId] || [];
  }, [chats, selectedChatId]);

  const chatIds = Object.keys(chats);

  function getMessageText(message) {
    if (typeof message === "string") return message;
    if (!message) return "";
    if (message.caption) return message.caption;
    if (message.type === "image") return "📷 Image";
    if (message.type === "video") return "🎥 Video";
    if (message.type === "audio") return "🎵 Audio";
    if (message.type === "document") return "📄 Document";
    return JSON.stringify(message);
  }

  function formatTime(date) {
    if (!date) return "";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusText() {
    switch (connectionStatus) {
      case "connected":
        return "Realtime Connected";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  }

  function getStatusColor() {
    switch (connectionStatus) {
      case "connected":
        return "#22c55e";
      case "connecting":
      case "reconnecting":
        return "#f59e0b";
      default:
        return "#ef4444";
    }
  }

  if (loading) {
    return <div style={styles.center}>Loading messages...</div>;
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <strong>J&T WhatsApp</strong>
          <div style={styles.status}>
            <span
              style={{
                ...styles.dot,
                background: getStatusColor(),
              }}
            />
            {getStatusText()}
          </div>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Conversations</div>

          {chatIds.length === 0 && (
            <div style={styles.empty}>No conversations</div>
          )}

          {chatIds.map((chatId) => {
            const messages = chats[chatId] || [];
            const lastMessage = messages[0];

            return (
              <button
                key={chatId}
                onClick={() => setSelectedChatId(chatId)}
                style={{
                  ...styles.chatItem,
                  ...(selectedChatId === chatId
                    ? styles.chatItemActive
                    : {}),
                }}
              >
                <div style={styles.chatName}>
                  {lastMessage?.first_name || chatId}
                </div>
                <div style={styles.chatPreview}>
                  {lastMessage
                    ? getMessageText(lastMessage.user_message)
                    : "No messages"}
                </div>
                <div style={styles.chatTime}>
                  {lastMessage ? formatTime(lastMessage.created_at) : ""}
                </div>
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
                <strong>
                  {selectedMessages[0]?.first_name || selectedChatId}
                </strong>
                <small>{selectedChatId}</small>
              </div>

              <div style={styles.messages}>
                {selectedMessages.length === 0 ? (
                  <div style={styles.center}>No messages</div>
                ) : (
                  selectedMessages
                    .slice()
                    .reverse()
                    .map((message) => (
                      <div
                        key={message.wa_message_id}
                        style={{
                          ...styles.messageRow,
                          justifyContent:
                            message.role === "me"
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...styles.bubble,
                            ...(message.role === "me"
                              ? styles.myBubble
                              : styles.contactBubble),
                          }}
                        >
                          <div style={styles.messageText}>
                            {getMessageText(message.user_message)}
                          </div>
                          <div style={styles.messageTime}>
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  app: {
    width: "100%",
    maxWidth: "1000px",
    height: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, Helvetica, sans-serif",
    background: "#fff",
    color: "#111",
  },
  header: { padding: "16px", borderBottom: "1px solid #ddd" },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    marginTop: "5px",
    color: "#666",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },
  content: { flex: 1, minHeight: 0, display: "flex" },
  sidebar: { width: "300px", borderRight: "1px solid #ddd", overflowY: "auto" },
  sidebarTitle: { padding: "14px", fontWeight: "bold", borderBottom: "1px solid #eee" },
  chatItem: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #eee",
    background: "#fff",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer",
  },
  chatItemActive: { background: "#f1f1f1" },
  chatName: { fontWeight: "bold", marginBottom: "4px" },
  chatPreview: {
    fontSize: "13px",
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chatTime: { fontSize: "11px", color: "#999", marginTop: "5px" },
  chat: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  chatHeader: {
    padding: "14px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    flexDirection: "column",
  },
  messages: { flex: 1, overflowY: "auto", padding: "16px" },
  messageRow: { display: "flex", marginBottom: "8px" },
  bubble: { maxWidth: "75%", padding: "9px 12px", borderRadius: "10px" },
  myBubble: { background: "#dcf8c6" },
  contactBubble: { background: "#f1f1f1" },
  messageText: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  messageTime: { fontSize: "10px", color: "#777", marginTop: "4px", textAlign: "right" },
  error: { padding: "10px", background: "#fee2e2", color: "#991b1b" },
  empty: { padding: "20px", color: "#888", textAlign: "center" },
  center: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#777" },
};
