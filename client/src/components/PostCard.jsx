import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/format";
import Avatar from "./Avatar";

export default function PostCard({ post, onChanged, compact = false }) {
  const { user } = useAuth();
  const isOwner = Number(user?.id) === Number(post.user_id);

  const [liked, setLiked] = useState(Number(post.is_liked) === 1);
  const [likeCount, setLikeCount] = useState(Number(post.like_count) || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleLike = async () => {
    setError("");
    try {
      const res = await api.post(`/posts/${post.id}/likes`);
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
      onChanged?.();
    } catch (err) {
      setError("Could not update like");
    }
  };

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data.comments);
      setShowComments(true);
    } catch (err) {
      setError("Could not load comments");
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: commentText,
      });
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText("");
      onChanged?.();
    } catch (err) {
      setError("Could not add comment");
    }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onChanged?.();
    } catch (err) {
      setError("Could not delete comment");
    }
  };

  const saveCommentEdit = async (e) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/comments/${editingCommentId}`, {
        content: editCommentText,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingCommentId ? { ...c, content: editCommentText } : c
        )
      );
      setEditingCommentId(null);
      onChanged?.();
    } catch (err) {
      setError("Could not save comment");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/posts/${post.id}`, { content: editContent });
      setEditing(false);
      onChanged?.();
    } catch (err) {
      setError("Could not save post");
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onChanged?.();
    } catch (err) {
      setError("Could not delete post");
    }
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3">
          <Avatar user={post} size={42} />
          <div>
            <p className="font-semibold text-gray-900 leading-tight">
              {post.full_name}
            </p>
            <p className="text-xs text-gray-500">
              @{post.username} · {timeAgo(post.created_at)}
            </p>
          </div>
        </Link>

        {isOwner && !editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditContent(post.content);
                setEditing(true);
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Edit
            </button>
            <button
              onClick={deletePost}
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={busy}
              className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-gray-800 whitespace-pre-line text-sm">
          {post.content}
        </p>
      )}

      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="mt-3 max-h-80 w-full object-cover rounded-lg"
        />
      )}

      {(likeCount > 0 || post.comment_count > 0) && !compact && (
        <div className="mt-3 text-xs text-gray-500">
          {likeCount > 0 && <span>{likeCount} likes</span>}
          {likeCount > 0 && post.comment_count > 0 && <span> · </span>}
          {post.comment_count > 0 && <span>{post.comment_count} comments</span>}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            liked
              ? "bg-red-50 text-red-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>{liked ? "♥" : "♡"}</span> Like
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          💬 Comment
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar user={c} size={28} />
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <Link to={`/profile/${c.user_id}`} className="font-semibold text-gray-900">
                    {c.full_name}
                  </Link>
                  {Number(c.user_id) === Number(user?.id) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditCommentText(c.content);
                        }}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        delete
                      </button>
                    </div>
                  )}
                </div>
                {editingCommentId === c.id ? (
                  <form onSubmit={saveCommentEdit} className="mt-1 flex items-center gap-2">
                    <input
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-brand-500 focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={busy || !editCommentText.trim()}
                      className="px-2 py-1 text-xs bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCommentId(null)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">{c.content}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  {timeAgo(c.created_at)}
                </p>
              </div>
            </div>
          ))}

          <form onSubmit={addComment} className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-full text-sm font-medium hover:bg-brand-700"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}