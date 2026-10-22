import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";

const TABS = ["Posts", "Friends", "Followers", "Following"];

export default function Profile() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const profileId = id || user?.id;

  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Posts");
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isSelf = Number(profileId) === Number(user?.id);
  const rel = profile?.relationship || { status: "none", direction: null };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/users/${profileId}`);
      setProfile(res.data.user);
      setEditForm({
        fullName: res.data.user.full_name || "",
        bio: res.data.user.bio || "",
        avatarUrl: res.data.user.avatar_url || "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load profile"));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const loadPosts = useCallback(async (page = 1, append = false) => {
    try {
      const res = await api.get(`/posts/user/${profileId}`, {
        params: { page },
      });
      setPosts((prev) =>
        append ? [...prev, ...res.data.posts] : res.data.posts
      );
      setPostsPage(page);
      setPostsHasMore(res.data.hasMore);
    } catch (err) {
      setError("Could not load posts");
    }
  }, [profileId]);

  useEffect(() => {
    loadProfile();
    loadPosts(1, false);
  }, [loadProfile, loadPosts]);

  const refresh = () => {
    loadProfile();
    loadPosts(1, false);
  };

  const handleFollow = async () => {
    setBusy(true);
    try {
      if (rel.status === "none") {
        await api.post(`/users/${profileId}/follow`);
      } else {
        await api.delete(`/users/${profileId}/follow`);
      }
      loadProfile();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.patch("/users/me", editForm);
      setUser(res.data.user);
      setEditing(false);
      setProfile((p) => ({ ...p, ...res.data.user }));
      setEditForm(res.data.user);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save profile"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner full />;
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  const followButton = !isSelf && (
    <button
      onClick={handleFollow}
      disabled={busy}
      className="px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 bg-brand-600 text-white hover:bg-brand-700"
    >
      {rel.status === "none"
        ? "Follow"
        : rel.status === "pending" && rel.direction === "outgoing"
        ? "Requested"
        : "Connected · Unfollow"}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <Avatar user={profile} size={96} />
          <div className="flex-1 min-w-48">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              {profile.role === "admin" && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                  Admin
                </span>
              )}
              {!profile.is_active && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                  Deactivated
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            <p className="mt-2 text-sm text-gray-700">{profile.bio || "No bio yet."}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-5 text-center">
              <div>
                <p className="font-bold text-lg">{profile.stats.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div>
                <p className="font-bold text-lg">{profile.stats.followers}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div>
                <p className="font-bold text-lg">{profile.stats.following}</p>
                <p className="text-xs text-gray-500">Following</p>
              </div>
            </div>
            {followButton}
            {isSelf && (
              <button
                onClick={() => setEditing((e) => !e)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>

        {editing && isSelf && (
          <form
            onSubmit={saveProfile}
            className="mt-6 border-t border-gray-100 pt-4 grid gap-3"
          >
            <input
              value={editForm.fullName || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, fullName: e.target.value })
              }
              placeholder="Full name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={editForm.avatarUrl || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, avatarUrl: e.target.value })
              }
              placeholder="Avatar URL"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={editForm.bio || ""}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Bio"
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4 flex gap-1">
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
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "Posts" && (
          <>
            <div className="space-y-4">
              {posts.length ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onChanged={refresh} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No posts yet.</p>
              )}
            </div>
            {postsHasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    setPostsLoadingMore(true);
                    loadPosts(postsPage + 1, true).finally(() =>
                      setPostsLoadingMore(false)
                    );
                  }}
                  disabled={postsLoadingMore}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {postsLoadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}

        {tab === "Friends" && <UserGrid users={profile.friends} empty="No friends yet." />}
        {tab === "Followers" && <UserGrid users={profile.followers} empty="No followers yet." />}
        {tab === "Following" && <UserGrid users={profile.following} empty="Not following anyone yet." />}
      </div>
    </div>
  );
}

function UserGrid({ users, empty }) {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500 py-8">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {users.map((u) => (
        <a
          key={u.id}
          href={`/profile/${u.id}`}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition"
        >
          <Avatar user={u} size={44} />
          <div>
            <p className="font-semibold text-gray-900">{u.full_name}</p>
            <p className="text-xs text-gray-500">@{u.username}</p>
          </div>
        </a>
      ))}
    </div>
  );
}