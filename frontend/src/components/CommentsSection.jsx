import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, TextField, Button, Avatar,
  IconButton, Chip, Divider, CircularProgress, Alert
} from "@mui/material";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

function CommentItem({ comment, user, onReply, onEdit, onDelete, isDark, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(depth === 0);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const isOwnComment = user?.id === comment.user_id || user?.username === comment.username;
  const isAdmin = user?.role === "Admin";

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setSubmittingEdit(true);
    try {
      await onEdit(comment.id, editContent);
      setEditing(false);
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      {/* Avatar */}
      <Avatar
        sx={{
          width: depth === 0 ? 40 : 32,
          height: depth === 0 ? 40 : 32,
          background: depth === 0 ? "#6366f1" : "#06b6d4",
          fontSize: depth === 0 ? 16 : 12,
          flexShrink: 0,
        }}
      >
        {comment.username?.[0]?.toUpperCase() || <PersonRoundedIcon sx={{ fontSize: depth === 0 ? 20 : 14 }} />}
      </Avatar>

      {/* Comment Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "inherit" }}>
            {comment.display_name || comment.username}
          </Typography>
          {comment.user_role && (
            <Chip
              label={comment.user_role}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 600,
                background: comment.user_role === "Admin" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                color: comment.user_role === "Admin" ? "#ef4444" : "#6366f1",
                border: `1px solid ${comment.user_role === "Admin" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
              }}
            />
          )}
          <Typography variant="caption" sx={{ color: "rgba(148,163,184,0.8)" }}>
            {timeAgo(comment.created_at)}
          </Typography>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <Typography variant="caption" sx={{ color: "rgba(148,163,184,0.6)", fontStyle: "italic" }}>
              (edited)
            </Typography>
          )}
        </Box>

        {/* Content */}
        {editing ? (
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: "0.85rem",
                },
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleEditSubmit}
                disabled={submittingEdit}
                sx={{ minWidth: 60 }}
              >
                {submittingEdit ? <CircularProgress size={14} /> : "Save"}
              </Button>
              <Button
                size="small"
                onClick={() => setEditing(false)}
                sx={{ minWidth: 60 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: isDark ? "rgba(241,245,249,0.9)" : "rgba(15,23,42,0.9)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {comment.content}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => onReply(comment)}
            sx={{ color: "rgba(148,163,184,0.7)", "&:hover": { color: "#6366f1" } }}
          >
            <ReplyRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {(isOwnComment || isAdmin) && !editing && (
            <>
              <IconButton
                size="small"
                onClick={() => setEditing(true)}
                sx={{ color: "rgba(148,163,184,0.7)", "&:hover": { color: "#06b6d4" } }}
              >
                <EditRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ color: "rgba(148,163,184,0.7)", "&:hover": { color: "#ef4444" } }}
              >
                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </>
          )}
        </Box>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                mb: 1,
              }}
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <ExpandLessRoundedIcon sx={{ fontSize: 16, color: "rgba(148,163,184,0.7)" }} />
              ) : (
                <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: "rgba(148,163,184,0.7)" }} />
              )}
              <Typography variant="caption" sx={{ color: "rgba(148,163,184,0.7)" }}>
                {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </Typography>
            </Box>
            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box sx={{ pl: 3, borderLeft: `2px solid ${isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.3)"}` }}>
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        user={user}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDark={isDark}
                        depth={depth + 1}
                      />
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function CommentsSection({ trfId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useApp();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (trfId) {
      fetchComments();
    }
  }, [trfId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/comments/trf/${trfId}/thread`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/comments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trf_id: trfId,
          content: newComment,
          parent_id: replyTo?.id || null
        })
      });

      if (response.ok) {
        toast.success('Comment added');
        setNewComment("");
        setReplyTo(null);
        fetchComments();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Comment submit error:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        toast.success('Comment updated');
        fetchComments();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Comment edit error:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Comment deleted');
        fetchComments();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Comment delete error:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    document.getElementById('comment-input')?.focus();
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const buildCommentTree = (parentId) => {
    return comments.filter(c => c.parent_id === parentId).map(c => ({
      ...c,
      replies: buildCommentTree(c.id)
    }));
  };
  const commentTree = topLevelComments.map(c => ({
    ...c,
    replies: buildCommentTree(c.id)
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.text.primary }}>
          Comments ({comments.length})
        </Typography>
      </Box>

      {/* New Comment Input */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Avatar sx={{ width: 40, height: 40, background: "#6366f1" }}>
          {user?.username?.[0]?.toUpperCase() || <PersonRoundedIcon />}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          {replyTo && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
                p: 1,
                borderRadius: 1,
                background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`,
              }}
            >
              <Typography variant="caption" sx={{ color: "#6366f1" }}>
                Replying to {replyTo.display_name || replyTo.username}
              </Typography>
              <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ p: 0.5 }}>
                <DeleteRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
          <TextField
            id="comment-input"
            fullWidth
            multiline
            rows={3}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmitComment();
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                background: isDark ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.06)",
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              startIcon={submitting ? null : <SendRoundedIcon />}
              sx={{
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                "&:hover": {
                  background: "linear-gradient(135deg,#4f46e5,#0891b2)",
                },
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Post Comment"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Comments List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : commentTree.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">No comments yet. Be the first to comment!</Typography>
        </Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <AnimatePresence>
            {commentTree.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                isDark={isDark}
              />
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
