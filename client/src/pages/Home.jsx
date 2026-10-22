import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(null);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadedFor, setLoadedFor] = useState({ posts: [] });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const loadFeed = useCallback(async (page = 1, append = false) => {
    try {
      const res = await api.get("/posts", { params: { page } });
      setPosts((prev) =>
        append ? [...(prev || []), ...res.data.posts] : res.data.posts
      );
      setHasMore(res.data.hasMore);
      setLoadedFor((lf) => ({ ...lf, posts: append ? page : 1 }));
    } catch (err) {
      setError("Could not load feed");
    }
  }, []);

  useEffect(() => {
    loadFeed(1, false);
  }, [loadFeed]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const next = loadedFor.posts + 1;
          loadFeed(next, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadedFor, loadFeed]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/posts", {
        content,
        imageUrl: imageUrl.trim() || undefined,
      });
      setContent("");
      setImageUrl("");
      loadFeed(1, false);
    } catch (err) {
      setError("Could not create post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Avatar user={user} size={42} />
          <form onSubmit={createPost} className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:ring-brand-500 focus:border-brand-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={busy || !content.trim()}
                className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {posts ? (
        posts.length ? (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onChanged={() => loadFeed(1, false)} />
            ))}
            <div ref={sentinelRef} className="h-2" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
            {!hasMore && (
              <p className="text-center text-gray-400 text-sm py-4">
                You're all caught up.
              </p>
            )}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">
              Your feed is empty. Follow or connect with other users to see their
              posts — or search the community.
            </p>
          </div>
        )
      ) : (
        <Spinner />
      )}
    </div>
  );
}