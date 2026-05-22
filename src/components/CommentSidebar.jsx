import React, { useState } from 'react';
import { X, MessageSquare, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

export default function CommentSidebar({ comments, onClose, onDeleteComment, onScrollTo }) {
  const [collapsed, setCollapsed] = useState({});

  function toggle(id) { setCollapsed(c => ({ ...c, [id]: !c[id] })); }

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-elev)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 42, display: 'flex', alignItems: 'center',
        padding: '0 12px', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <MessageSquare size={13} color="var(--fg-muted)" style={{ marginRight: 7 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
          Comments {comments.length > 0 && <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400 }}>({comments.length})</span>}
        </span>
        <button className="btn icon" onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {comments.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 12, lineHeight: 1.6 }}>
            <MessageSquare size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div>No comments yet.</div>
            <div>Select text and click the comment button in the toolbar.</div>
          </div>
        )}
        {comments.map((c, i) => (
          <CommentCard
            key={c.id}
            comment={c}
            index={i + 1}
            collapsed={!!collapsed[c.id]}
            onToggle={() => toggle(c.id)}
            onDelete={() => onDeleteComment(c.id)}
            onScrollTo={() => onScrollTo(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CommentCard({ comment, index, collapsed, onToggle, onDelete, onScrollTo }) {
  const [hover, setHover] = useState(false);
  const date = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        margin: '0 8px 4px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: hover ? 'var(--bg-hover)' : 'var(--bg)',
        overflow: 'hidden',
        transition: 'background 0.1s',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', gap: 6, cursor: 'pointer' }}
        onClick={onScrollTo}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg-active)', color: 'var(--fg-muted)',
          fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{index}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Quoted text preview */}
          <div style={{
            fontSize: 11, color: 'var(--fg-muted)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontStyle: 'italic',
          }}>
            "{comment.quotedText?.slice(0, 40) ?? ''}…"
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            {collapsed ? <ChevronRight size={11}/> : <ChevronDown size={11}/>}
          </button>
          {hover && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85a5a', padding: 2, display: 'flex', alignItems: 'center' }}
            >
              <Trash2 size={11}/>
            </button>
          )}
        </div>
      </div>

      {/* Comment body */}
      {!collapsed && (
        <div style={{ padding: '0 10px 10px' }}>
          <div style={{
            fontSize: 12, color: 'var(--fg)', lineHeight: 1.55,
            background: 'var(--bg-sunken)', borderRadius: 4,
            padding: '7px 9px',
          }}>
            {comment.text}
          </div>
          {date && (
            <div style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 5 }}>{date}</div>
          )}
        </div>
      )}
    </div>
  );
}
