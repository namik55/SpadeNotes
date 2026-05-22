import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const PRIORITIES = ['none', 'low', 'medium', 'high'];
const PRIORITY_COLORS = {
  none:   'var(--fg-subtle)',
  low:    '#3aa6c6',
  medium: '#e8c14a',
  high:   '#e85a5a',
};

export default function Tasks() {
  const [tasks,      setTasks]      = useState([]);
  const [input,      setInput]      = useState('');
  const [priority,   setPriority]   = useState('none');
  const [dueDate,    setDueDate]    = useState('');
  const [filter,     setFilter]     = useState('all'); // 'all' | 'active' | 'done'
  const [collapsed,  setCollapsed]  = useState({});
  const inputRef = useRef();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('notesapp_tasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch {}
  }, []);

  function saveTasks(next) {
    setTasks(next);
    try { localStorage.setItem('notesapp_tasks', JSON.stringify(next)); } catch {}
  }

  function addTask() {
    if (!input.trim()) return;
    const next = [...tasks, {
      id:        Date.now(),
      title:     input.trim(),
      done:      false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      subtasks:  [],
    }];
    saveTasks(next);
    setInput('');
    setDueDate('');
    setPriority('none');
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    saveTasks(tasks.filter(t => t.id !== id));
  }

  function addSubtask(parentId, title) {
    if (!title.trim()) return;
    saveTasks(tasks.map(t => t.id === parentId
      ? { ...t, subtasks: [...(t.subtasks ?? []), { id: Date.now(), title: title.trim(), done: false }] }
      : t
    ));
  }

  function toggleSubtask(parentId, subId) {
    saveTasks(tasks.map(t => t.id === parentId
      ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) }
      : t
    ));
  }

  function deleteSubtask(parentId, subId) {
    saveTasks(tasks.map(t => t.id === parentId
      ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subId) }
      : t
    ));
  }

  const today = dateKey(new Date());

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return t.done;
    return true;
  });

  const activeCnt = tasks.filter(t => !t.done).length;
  const doneCnt   = tasks.filter(t => t.done).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      background: 'var(--bg)',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <h2 style={{
          fontFamily: 'var(--serif)',
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          marginBottom: 14,
        }}>Tasks</h2>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
          {[
            { key: 'all',    label: `All (${tasks.length})` },
            { key: 'active', label: `Active (${activeCnt})` },
            { key: 'done',   label: `Done (${doneCnt})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              color: filter === f.key ? 'var(--fg)' : 'var(--fg-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: filter === f.key ? '1.5px solid var(--fg)' : '1.5px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── Add task ── */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Add a new task…"
            style={{
              flex: 1,
              height: 34,
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontFamily: 'var(--sans)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button className="btn primary" onClick={addTask} style={{ gap: 5 }}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Priority + due date */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Priority:</span>
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              height: 22,
              padding: '0 8px',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 3,
              border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : 'var(--border)'}`,
              background: priority === p ? PRIORITY_COLORS[p] + '22' : 'transparent',
              color: priority === p ? PRIORITY_COLORS[p] : 'var(--fg-muted)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}>{p}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Due:</span>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{
              height: 26,
              padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontFamily: 'var(--sans)',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Task list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {filtered.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            color: 'var(--fg-muted)',
            textAlign: 'center',
          }}>
            <CheckCircle2 size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>
              {filter === 'done' ? 'No completed tasks yet.' : 'No tasks yet. Add one above.'}
            </p>
          </div>
        )}

        {filtered.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            today={today}
            collapsed={collapsed}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
            onToggleCollapse={() => setCollapsed(c => ({ ...c, [task.id]: !c[task.id] }))}
            onAddSubtask={title => addSubtask(task.id, title)}
            onToggleSubtask={subId => toggleSubtask(task.id, subId)}
            onDeleteSubtask={subId => deleteSubtask(task.id, subId)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task, today, collapsed,
  onToggle, onDelete, onToggleCollapse,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
}) {
  const [hover,       setHover]       = useState(false);
  const [subInput,    setSubInput]    = useState('');
  const [showSubAdd,  setShowSubAdd]  = useState(false);
  const isCollapsed = collapsed[task.id];
  const hasSubtasks = task.subtasks?.length > 0;
  const isOverdue   = task.dueDate && task.dueDate < today && !task.done;

  return (
    <div style={{
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      background: hover ? 'var(--bg-hover)' : 'var(--bg)',
      marginBottom: 6,
      overflow: 'hidden',
      transition: 'background 80ms',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Main row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
      }}>
        {/* Collapse toggle */}
        <button onClick={onToggleCollapse} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--fg-subtle)', padding: 0, width: 16, flexShrink: 0,
        }}>
          {hasSubtasks
            ? (isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />)
            : <span style={{ width: 13 }} />}
        </button>

        {/* Check */}
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: task.done ? 'var(--fg-muted)' : 'var(--fg)',
          padding: 0, flexShrink: 0,
        }}>
          {task.done
            ? <CheckCircle2 size={17} style={{ color: 'var(--fg-muted)' }} />
            : <Circle size={17} />}
        </button>

        {/* Priority dot */}
        {task.priority !== 'none' && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: PRIORITY_COLORS[task.priority],
          }} />
        )}

        {/* Title */}
        <span style={{
          flex: 1,
          fontSize: 13,
          color: task.done ? 'var(--fg-muted)' : 'var(--fg)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            color: isOverdue ? '#e85a5a' : 'var(--fg-subtle)',
            flexShrink: 0,
          }}>
            {task.dueDate}
          </span>
        )}

        {/* Actions (on hover) */}
        {hover && (
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className="btn icon sm"
              onClick={() => setShowSubAdd(s => !s)}
              title="Add subtask"
              style={{ opacity: 0.7 }}
            >
              <Plus size={11} />
            </button>
            <button
              className="btn icon sm"
              onClick={onDelete}
              title="Delete"
              style={{ opacity: 0.7 }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {!isCollapsed && hasSubtasks && (
        <div style={{ paddingLeft: 38, paddingBottom: 4 }}>
          {task.subtasks.map(sub => (
            <div key={sub.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 12px 4px 0',
            }}>
              <button onClick={() => onToggleSubtask(sub.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: sub.done ? 'var(--fg-muted)' : 'var(--fg)', padding: 0,
              }}>
                {sub.done
                  ? <CheckCircle2 size={14} style={{ color: 'var(--fg-muted)' }} />
                  : <Circle size={14} />}
              </button>
              <span style={{
                flex: 1, fontSize: 12,
                color: sub.done ? 'var(--fg-muted)' : 'var(--fg)',
                textDecoration: sub.done ? 'line-through' : 'none',
              }}>
                {sub.title}
              </span>
              <button className="btn icon sm" onClick={() => onDeleteSubtask(sub.id)}
                style={{ opacity: 0.5 }}>
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {showSubAdd && (
        <div style={{ padding: '4px 12px 8px 38px', display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={subInput}
            onChange={e => setSubInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && subInput.trim()) {
                onAddSubtask(subInput.trim());
                setSubInput('');
                setShowSubAdd(false);
              }
              if (e.key === 'Escape') setShowSubAdd(false);
            }}
            placeholder="Subtask title… (Enter to add)"
            style={{
              flex: 1, height: 26, padding: '0 8px', fontSize: 12,
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              background: 'var(--bg)', color: 'var(--fg)',
              fontFamily: 'var(--sans)', outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
