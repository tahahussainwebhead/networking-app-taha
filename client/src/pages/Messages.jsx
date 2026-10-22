import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Avatar from "../components/Avatar";
import { timeAgo } from "../utils/format";

export default function Messages() {
  const { user } = useAuth();
  const { on } = useSocket();
  const { userId: activeId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId || null;

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages");
      setConversations(res.data.conversations);
    } catch (err) {
      setError("Could not load conversations");
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeId) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${activeId}`);
      setMessages(res.data.messages);
    } catch (err) {
      setError("Could not load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [activeId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!on) return;
    return on("message:new", (msg) => {
      loadConversations();
      const partner = activeIdRef.current;
      if (
        partner &&
        (Number(msg.sender_id) === Number(partner) ||
          Number(msg.receiver_id) === Number(partner))
      ) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
  }, [on, loadConversations]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setBusy(true);
    try {
      const res = await api.post(`/messages/${activeId}`, { content: text });
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send message"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-5rem)] flex bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Conversations sidebar */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Messages</h2>
        </div>
        {loadingConvos ? (
          <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No conversations yet. Start one by messaging someone from their profile.
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = Number(c.id) === Number(activeId);
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/messages/${c.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  isActive ? "bg-brand-50" : ""
                }`}
              >
                <div className="relative">
                  <Avatar user={c} size={44} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {c.full_name}
                    </span>
                    {c.unread > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-xs font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.last_message}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {conversations.find((c) => Number(c.id) === Number(activeId))
                  ?.full_name || `User #${activeId}`}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMessages ? (
                <p className="text-center text-gray-400 text-sm">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const mine = Number(m.sender_id) === Number(user?.id);
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                          mine
                            ? "bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            mine ? "text-brand-200" : "text-gray-400"
                          }`}
                        >
                          {timeAgo(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error && (
              <p className="px-4 py-1 text-xs text-red-600 bg-red-50">{error}</p>
            )}
            <form
              onSubmit={send}
              className="border-t border-gray-100 px-4 py-3 flex items-center gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-full text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}