import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import Avatar from "../components/Avatar";
import { timeAgo } from "../utils/format";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "posts", label: "Posts" },
  { key: "reports", label: "Reports" },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [usersQ, setUsersQ] = useState("");
  const [postsQ, setPostsQ] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load stats"));
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const res = await api.get("/reports");
      setReport(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load reports"));
    }
  }, []);

  const loadUsers = useCallback(
    async (q) => {
      try {
        const res = await api.get("/admin/users", {
          params: q ? { q } : {},
        });
        setUsers(res.data.users);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load users"));
      }
    },
    []
  );

  const loadPosts = useCallback(
    async (q) => {
      try {
        const res = await api.get("/admin/posts", {
          params: q ? { q } : {},
        });
        setPosts(res.data.posts);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load posts"));
      }
    },
    []
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === "overview") loadStats();
    if (tab === "reports") loadReport();
    if (tab === "users") loadUsers(usersQ);
    if (tab === "posts") loadPosts(postsQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const doAction = async (fn, msg) => {
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(msg);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    }
  };

  const toggleRole = (u) =>
    doAction(
      async () => {
        await api.patch(`/admin/users/${u.id}/role`, {
          role: u.role === "admin" ? "user" : "admin",
        });
        loadUsers(usersQ);
      },
      `Role updated for ${u.username}`
    );

  const toggleStatus = (u) =>
    doAction(
      async () => {
        await api.patch(`/admin/users/${u.id}/status`, {
          isActive: !u.is_active,
        });
        loadUsers(usersQ);
      },
      `Status updated for ${u.username}`
    );

  const deletePost = (p) =>
    doAction(
      async () => {
        if (!window.confirm(`Delete post #${p.id} by ${p.username}?`)) return;
        await api.delete(`/admin/posts/${p.id}`);
        loadPosts(postsQ);
      },
      `Post #${p.id} deleted`
    );

  const statCards = stats
    ? [
        ["Users", stats.users],
        ["Posts", stats.posts],
        ["Likes", stats.likes],
        ["Comments", stats.comments],
        ["Messages", stats.messages],
        ["Connections", stats.friendships],
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
          {notice}
        </p>
      )}

      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t.key
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(([label, value]) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Manage users</h2>
            <input
              value={usersQ}
              onChange={(e) => {
                setUsersQ(e.target.value);
                loadUsers(e.target.value);
              }}
              placeholder="Search users..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-center">Role</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Posts</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar user={u} size={32} />
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={busy === `role-${u.id}`}
                        onClick={() => {
                          setBusy(`role-${u.id}`);
                          toggleRole(u).finally(() => setBusy(""));
                        }}
                        className={`px-2 py-1 text-xs rounded-lg font-semibold border ${
                          u.role === "admin"
                            ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-lg font-semibold ${
                          Number(u.is_active) === 1
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {Number(u.is_active) === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {u.post_count}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        disabled={busy === `status-${u.id}`}
                        onClick={() => {
                          setBusy(`status-${u.id}`);
                          toggleStatus(u).finally(() => setBusy(""));
                        }}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        {Number(u.is_active) === 1 ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">
                No users found.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "posts" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Moderate posts</h2>
            <input
              value={postsQ}
              onChange={(e) => {
                setPostsQ(e.target.value);
                loadPosts(e.target.value);
              }}
              placeholder="Search posts..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {posts.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">
                No posts found.
              </p>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                  <Avatar user={p} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {p.full_name}{" "}
                      <span className="text-xs text-gray-400 font-normal">
                        @{p.username} · {timeAgo(p.created_at)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                      {p.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ♥ {p.like_count} · 💬 {p.comment_count}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(p)}
                    className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "reports" && (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold text-gray-800 mb-3">
              Top active users
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {report?.topActiveUsers?.map((u, i) => (
                <div
                  key={u.id}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <span className="w-5 text-center text-sm font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <Avatar user={u} size={36} />
                  <p className="flex-1 font-medium text-sm text-gray-900">
                    {u.full_name}
                    <span className="text-xs text-gray-400 block">@{u.username}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {u.activity_score} actions
                  </p>
                </div>
              ))}
              {report?.topActiveUsers?.length === 0 && (
                <p className="px-4 py-8 text-center text-gray-400 text-sm">
                  No activity yet.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-3">
              Sign-ups last 7 days
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              {report?.signupsLast7Days?.length ? (
                <div className="flex items-end gap-3 h-40">
                  {report.signupsLast7Days.map((d) => {
                    const max = Math.max(
                      1,
                      ...report.signupsLast7Days.map((x) => x.total)
                    );
                    const h = Math.round((d.total / max) * 100);
                    return (
                      <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <span className="text-xs font-semibold text-gray-600">
                          {d.total}
                        </span>
                        <div
                          className="w-full bg-brand-500 rounded-t-md"
                          style={{ height: `${h}px` }}
                        />
                        <span className="text-[10px] text-gray-400">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">
                  No sign-ups recorded yet.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-3">
              Recent activity
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {report?.activity?.slice(0, 20).map((a) => (
                <div key={a.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 font-mono text-xs text-brand-700">
                    {a.action}
                  </span>
                  <span className="flex-1 text-gray-600 truncate">
                    {a.details || a.username || "system"}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
              ))}
              {report?.activity?.length === 0 && (
                <p className="px-4 py-8 text-center text-gray-400 text-sm">
                  No activity logged yet.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}