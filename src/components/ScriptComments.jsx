import React, { useState, useEffect } from "react";
import { listScriptComments, createScriptComment, deleteScriptComment } from "../api/client.js";
import LimitedTextarea from "./shared/LimitedTextarea.jsx";

export default function ScriptComments({ scriptId, userEmail }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentType, setCommentType] = useState("comment");

  useEffect(() => {
    if (!scriptId) return;
    loadComments();
  }, [scriptId]);

  async function loadComments() {
    setLoading(true);
    try {
      const rows = await listScriptComments(scriptId);
      setComments(rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const submit = async () => {
    if (!newComment.trim() || !scriptId) return;
    setSaving(true);
    try {
      await createScriptComment(scriptId, newComment, commentType);
      setNewComment("");
      await loadComments();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteScriptComment(id);
      await loadComments();
    } catch (e) {
      console.error(e);
    }
  };

  const initials = (email) => (email || "?").slice(0, 2).toUpperCase();

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        💬 Team Feedback
        {comments.length > 0 && <span className="chip">{comments.length}</span>}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
          <span className="spinner dark" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 13, color: "var(--faint)" }}>Loading comments…</span>
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div style={{ padding: "14px 0", color: "var(--faint)", fontSize: 13, lineHeight: 1.55 }}>
          No comments yet. Be the first to share feedback or approve this script.
        </div>
      )}

      <div className="comment-thread">
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-avatar">{initials(c.author_email)}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{c.author_email}</span>
                <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
                {c.type !== "comment" && (
                  <span className={`comment-badge ${c.type}`}>{c.type}</span>
                )}
                {c.author_email === userEmail && (
                  <button className="ps-btn ghost sm" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => remove(c.id)}>Delete</button>
                )}
              </div>
              <div className="comment-text">{c.content}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line-soft)" }}>
        <div className="comment-input">
          <LimitedTextarea
            placeholder="Add feedback, approval, or revision note…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submit(); }}
            maxLength={2000}
          />
        </div>
        <div className="comment-actions">
          <select className="fsel" style={{ width: "auto", minWidth: 120, fontSize: 12 }} value={commentType} onChange={(e) => setCommentType(e.target.value)}>
            <option value="comment">💬 Comment</option>
            <option value="approval">✓ Approval</option>
            <option value="revision">↗ Revision needed</option>
          </select>
          <button className="ps-btn pri sm" disabled={!newComment.trim() || saving} onClick={submit}>
            {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving…</> : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
