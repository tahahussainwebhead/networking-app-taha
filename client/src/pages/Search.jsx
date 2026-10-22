import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (!query) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError("");
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get("/search", { params: { q: query } });
        setResults(res.data);
      } catch (err) {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Search</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search users or posts..."
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 focus:border-brand-500"
      />

      {loading && <Spinner />}
      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {results && (
        <div className="mt-6 space-y-8">
          {results.users?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                People
              </h2>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition"
                  >
                    <Avatar user={u} size={44} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                      {u.bio && (
                        <p className="text-xs text-gray-600 truncate">{u.bio}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.posts?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Posts
              </h2>
              <div className="space-y-4">
                {results.posts.map((p) => (
                  <PostCard key={p.id} post={p} onChanged={() => {}} />
                ))}
              </div>
            </section>
          )}

          {results.users?.length === 0 && results.posts?.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No results for "{q}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}