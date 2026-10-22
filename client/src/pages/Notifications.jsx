import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useSocket } from "../context/SocketContext";
import Avatar from "../components/Avatar";
import { timeAgo } from "../utils/format";

const TABS = ["Notifications", "Friend Requests"];

export default function Notifications() {
  const { on } = useSocket();
  const [tab, setTab] = useState("Notifications");
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
    } catch (err) {
      setError("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    try {
      const res = await api.get("/friendships/requests");
      setFriendRequests(res.data.requests);
    } catch (err) {
      setError("Could not load friend requests");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadFriendRequests();
  }, [loadNotifications, loadFriendRequests]);

  useEffect(() => {
    if (!on) return;
    return on("notification:new", () => {
      loadNotifications();
      loadFriendRequests();
    });
  }, [on, loadNotifications, loadFriendRequests]);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    }
  };

  const acceptRequest = async (friendshipId) => {
    setBusy(friendshipId);
    try {
      await api.post(`/friendships/${friendshipId}/accept`);
      loadFriendRequests();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy("");
    }
  };

  const removeRequest = async (friendshipId) => {
    setBusy(friendshipId);
    try {
      await api.delete(`/friendships/${friendshipId}`);
      loadFriendRequests();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {tab === "Notifications" && (
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t}
            {t === "Friend Requests" && friendRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8">Loading...</p>
      ) : tab === "Notifications" ? (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-400 text-sm">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 flex items-center gap-3 ${
                  Number(n.is_read) === 0 ? "bg-brand-50" : ""
                }`}
              >
                {n.actor_id && (
                  <Link to={`/profile/${n.actor_id}`}>
                    <Avatar user={n} size={36} />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {n.actor_id ? <b>{n.full_name}</b> : "Someone"}{" "}
                    {n.type === "like" && "liked your post"}
                    {n.type === "comment" && "commented on your post"}
                    {n.type === "friend_request" && "sent you a follow request"}
                    {n.type === "friend_accepted" && "accepted your follow request"}
                    {n.type === "message" && "sent you a message"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {Number(n.is_read) === 0 && (
                  <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {friendRequests.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-400 text-sm">
              No pending friend requests.
            </p>
          ) : (
            friendRequests.map((r) => (
              <div
                key={r.friendship_id}
                className="px-4 py-3 flex items-center gap-3"
              >
                <Link to={`/profile/${r.id}`}>
                  <Avatar user={r} size={44} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {r.full_name}
                  </p>
                  <p className="text-xs text-gray-500">@{r.username}</p>
                  {r.bio && (
                    <p className="text-xs text-gray-600 truncate">{r.bio}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => acceptRequest(r.friendship_id)}
                    disabled={busy === r.friendship_id}
                    className="px-3 py-1 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => removeRequest(r.friendship_id)}
                    disabled={busy === r.friendship_id}
                    className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}