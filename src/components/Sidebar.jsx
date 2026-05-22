import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Star, FileText, Folder, ChevronRight, ChevronDown, ChevronLeft,
  Settings, HelpCircle, X, Clock, Edit2, Trash2, Archive,
} from 'lucide-react';

const NB_COLORS = ['#e85a5a','#e89043','#e8c244','#7fc454','#3fb78c',
                   '#3aa6c6','#4a7fd6','#7c5fd6','#c25aa3','#d65a72'];

function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return NB_COLORS[Math.abs(h) % NB_COLORS.length];
}

function loadTrash() {
  try { return JSON.parse(localStorage.getItem('notesapp_trash') || '[]'); } catch { return []; }
}
function saveTrash(items) {
  try { localStorage.setItem('notesapp_trash', JSON.stringify(items)); } catch {}
}
export function moveToTrash(item) {
  const trash = loadTrash();
  if (trash.find(t => (t.path ?? t.name) === (item.path ?? item.name))) return;
  trash.push({ ...item, deletedAt: Date.now() });
  saveTrash(trash);
}
export function restoreFromTrash(item) {
  saveTrash(loadTrash().filter(t => (t.path ?? t.name) !== (item.path ?? item.name)));
}

// ── Archive ───────────────────────────────────────────────────────────────
function loadArchive() {
  try { return JSON.parse(localStorage.getItem('notesapp_archive') || '[]'); } catch { return []; }
}
function saveArchive(items) {
  try { localStorage.setItem('notesapp_archive', JSON.stringify(items)); } catch {}
}
export function moveToArchive(item) {
  const archive = loadArchive();
  if (archive.find(a => (a.path ?? a.name) === (item.path ?? item.name))) return;
  archive.push({ ...item, archivedAt: Date.now() });
  saveArchive(archive);
}
export function restoreFromArchive(item) {
  saveArchive(loadArchive().filter(a => (a.path ?? a.name) !== (item.path ?? item.name)));
}

function purgeExpiredTrash() {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  saveTrash(loadTrash().filter(t => Date.now() - t.deletedAt < THREE_DAYS));
}

// ── Tasks ─────────────────────────────────────────────────────────
function SidebarTasks() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { try { const s = localStorage.getItem('notesapp_tasks'); if (s) setTasks(JSON.parse(s)); } catch {} }, []);
  function save(next) { setTasks(next); try { localStorage.setItem('notesapp_tasks', JSON.stringify(next)); } catch {} }
  function addTask() { if (!input.trim()) return; save([...tasks, { id: Date.now(), title: input.trim(), done: false, subtasks: [] }]); setInput(''); }
  function toggleTask(id) { save(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id) { save(tasks.filter(t => t.id !== id)); }
  function confirmEdit(id) { if (editText.trim()) save(tasks.map(t => t.id === id ? { ...t, title: editText.trim() } : t)); setEditId(null); }
  function addSubtask(pid, text) { if (!text.trim()) return; save(tasks.map(t => t.id === pid ? { ...t, subtasks: [...(t.subtasks ?? []), { id: Date.now(), title: text.trim(), done: false }] } : t)); }
  function toggleSub(pid, sid) { save(tasks.map(t => t.id === pid ? { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) } : t)); }
  function deleteSub(pid, sid) { save(tasks.map(t => t.id === pid ? { ...t, subtasks: t.subtasks.filter(s => s.id !== sid) } : t)); }

  return (
    <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="New task…" style={{ flex: 1, height: 26, padding: '0 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--sans)', outline: 'none' }} />
        <button className="btn icon sm" onClick={addTask} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12}/></button>
      </div>
      {tasks.map(t => (
        <TaskItem key={t.id} task={t}
          isEditing={editId === t.id} editText={editText} onEditTextChange={setEditText}
          onStartEdit={() => { setEditId(t.id); setEditText(t.title); }}
          onConfirmEdit={() => confirmEdit(t.id)}
          onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)}
          onAddSub={text => addSubtask(t.id, text)}
          onToggleSub={sid => toggleSub(t.id, sid)} onDeleteSub={sid => deleteSub(t.id, sid)} />
      ))}
      {tasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>}
    </div>
  );
}

function TaskItem({ task, isEditing, editText, onEditTextChange, onStartEdit, onConfirmEdit, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub }) {
  const [hover, setHover] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [subInput, setSubInput] = useState('');
  const [showSub, setShowSub] = useState(false);
  const hasSubs = task.subtasks?.length > 0;
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: 4, borderRadius: 4, background: hover ? 'var(--bg-hover)' : 'transparent' }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 0, width: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasSubs ? (expanded ? <ChevronDown size={10}/> : <ChevronRight size={10}/>) : <span style={{ width: 10 }} />}
        </button>
        <input type="checkbox" checked={task.done} onChange={onToggle} style={{ width: 13, height: 13, accentColor: 'var(--fg)', cursor: 'pointer', flexShrink: 0 }} />
        {isEditing ? (
          <input autoFocus value={editText} onChange={e => onEditTextChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onConfirmEdit(); }} onBlur={onConfirmEdit}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 12, borderBottom: '1px solid var(--border)' }} />
        ) : (
          <span onDoubleClick={onStartEdit} style={{ flex: 1, fontSize: 12, color: task.done ? 'var(--fg-subtle)' : 'var(--fg)', textDecoration: task.done ? 'line-through' : 'none', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
        )}
        {hover && !isEditing && (
          <div style={{ display: 'flex', gap: 1 }}>
            <button onClick={() => setShowSub(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '0 2px', display: 'flex', alignItems: 'center' }}><Plus size={10}/></button>
            <button onClick={onStartEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '0 2px', display: 'flex', alignItems: 'center' }}><Edit2 size={10}/></button>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '0 2px', display: 'flex', alignItems: 'center' }}><X size={10}/></button>
          </div>
        )}
      </div>
      {expanded && hasSubs && (
        <div style={{ paddingLeft: 24 }}>
          {task.subtasks.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 4px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <input type="checkbox" checked={s.done} onChange={() => onToggleSub(s.id)} style={{ width: 11, height: 11, accentColor: 'var(--fg)', cursor: 'pointer' }} />
              <span style={{ flex: 1, fontSize: 11, color: s.done ? 'var(--fg-subtle)' : 'var(--fg)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
              <button onClick={() => onDeleteSub(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 0, display: 'flex', alignItems: 'center' }}><X size={9}/></button>
            </div>
          ))}
        </div>
      )}
      {showSub && (
        <div style={{ paddingLeft: 24, paddingRight: 4, paddingBottom: 4 }}>
          <input autoFocus value={subInput} onChange={e => setSubInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && subInput.trim()) { onAddSub(subInput); setSubInput(''); setShowSub(false); } if (e.key === 'Escape') setShowSub(false); }}
            placeholder="Subtask… (Enter)" style={{ width: '100%', height: 22, padding: '0 6px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 3, background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--sans)', outline: 'none' }} />
        </div>
      )}
    </div>
  );
}

// ── Trash ─────────────────────────────────────────────────────────
function TrashPanel({ onRestore, onPermDelete }) {
  const [items, setItems] = useState([]);
  useEffect(() => { purgeExpiredTrash(); setItems(loadTrash()); }, []);
  const THREE = 3 * 24 * 60 * 60 * 1000;
  function daysLeft(t) { return Math.max(0, Math.ceil((THREE - (Date.now() - t)) / (24*60*60*1000))); }
  return (
    <div style={{ padding: '0 8px' }}>
      {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', padding: '8px 4px' }}>Trash is empty</div>}
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px', borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {item.type === 'notebook' ? <Folder size={13} color="var(--fg-muted)"/> : <FileText size={13} color="var(--fg-muted)"/>}
          <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-muted)' }}>{item.name}</span>
          <span style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>{daysLeft(item.deletedAt)}d</span>
          <button onClick={() => { onRestore(item); setItems(loadTrash()); }} title="Restore" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', fontSize: 13, padding: '0 2px' }}>↩</button>
          <button onClick={() => { onPermDelete(item); restoreFromTrash(item); setItems(loadTrash()); }} title="Delete permanently" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85a5a', padding: '0 2px', display: 'flex', alignItems: 'center' }}><X size={10}/></button>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
// ── Archive Panel ─────────────────────────────────────────────────────────
function ArchivePanel({ onRestore, onOpen }) {
  const [items, setItems] = useState([]);
  useEffect(() => { setItems(loadArchive()); }, []);
  return (
    <div style={{ padding: '2px 8px 4px 28px', maxHeight: 200, overflowY: 'auto' }}>
      {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', padding: '8px 4px' }}>Archive is empty</div>}
      {items.map(item => (
        <div key={item.path ?? item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px', fontSize: 12 }}>
          <span onClick={() => item.path && onOpen?.(item)} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-muted)', cursor: item.path ? 'pointer' : 'default' }}
            onMouseEnter={e => { if(item.path) e.target.style.color='var(--fg)'; }}
            onMouseLeave={e => e.target.style.color='var(--fg-muted)'}
          >{item.name}</span>
          <button onClick={() => { onRestore(item); restoreFromArchive(item); setItems(loadArchive()); }} title="Restore"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', fontSize: 13, padding: '0 2px' }}>↩</button>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({
  activeTab, onTabChange, notebooks = [],
  activeNote, onNoteSelect, onNewNote, onNewNotebook,
  onOpenSettings, onOpenSearch, onOpenHelp,
  onDeleteNotebook, onAddNoteToNotebook,
  onDeleteNote, onRenameNote, onHideNote,
  onRenameNotebook, onCreateSubNotebook, onMoveNote, onMoveNotebook,
  recents = [], pinned = [],
  onTogglePinned,
  onRestoreFromTrash, onPermanentDelete,
  onRestoreFromArchive,
  showNotebookColors = true,
  collapsed = false,
  onToggleCollapse,
}) {
  const [expanded,   setExpanded]   = useState({});
  const [hoveredNb,  setHoveredNb]  = useState(null);
  const [showTrash,  setShowTrash]  = useState(false);
  const [showArchive,setShowArchive]= useState(false);
  const [renamingNb, setRenamingNb] = useState(null); // notebook name being renamed
  const [renameVal,  setRenameVal]  = useState('');
  const [addingSubTo,setAddingSubTo]= useState(null); // nb.name for inline sub-notebook creation
  const [subVal,     setSubVal]     = useState('');
  const [dragItem,   setDragItem]   = useState(null); // {type:'note'|'notebook', item}
  const [dragOver,   setDragOver]   = useState(null); // notebook name being hovered during drag

  // Filter out trashed and archived notes from sidebar display
  const trashedPaths  = new Set(loadTrash().map(i => i.path).filter(Boolean));
  const archivedPaths = new Set(loadArchive().map(i => i.path).filter(Boolean));
  const visibleNotebooks = notebooks.map(nb => ({
    ...nb,
    notes: (nb.notes || []).filter(n => !trashedPaths.has(n.path) && !archivedPaths.has(n.path)),
  }));

  function toggleNb(name) { setExpanded(e => ({ ...e, [name]: !e[name] })); }

  return (
    <aside style={{ width: '100%', flexShrink: 0, background: 'var(--bg-elev)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {collapsed ? (
        /* ── Collapsed: icon strip ── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 4, flex: 1 }}>
          {/* Expand button */}
          <button onClick={onToggleCollapse} title="Expand sidebar"
            style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronRight size={16}/>
          </button>
          <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }}/>
          <button onClick={onOpenSearch} title="Search (Ctrl+F)"
            style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Search size={15}/>
          </button>
          <button onClick={onNewNote} title="New note"
            style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Plus size={15}/>
          </button>
          <button onClick={onNewNotebook} title="New notebook"
            style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Folder size={15}/>
          </button>
          <div style={{ flex: 1 }}/>
          <button onClick={onOpenSettings} title="Settings"
            style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', marginBottom: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Settings size={15}/>
          </button>
        </div>
      ) : (<>
      {/* Search */}
      <div style={{ padding: '12px 10px 8px' }}>
        <button onClick={onOpenSearch} style={{ width: '100%', height: 30, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'text', color: 'var(--fg-subtle)', fontSize: 13, fontFamily: 'var(--sans)' }}>
          <Search size={13}/><span style={{ flex: 1, textAlign: 'left' }}>Search notes…</span><span style={{ fontSize: 11, opacity: 0.5 }}>Ctrl+F</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid var(--border)', gap: 2 }}>
        {['Notebooks','Tasks','Recent'].map(tab => (
          <button key={tab} onClick={() => onTabChange(tab.toLowerCase())} style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, color: activeTab === tab.toLowerCase() ? 'var(--fg)' : 'var(--fg-muted)', background: 'transparent', border: 'none', borderBottom: activeTab === tab.toLowerCase() ? '1.5px solid var(--fg)' : '1.5px solid transparent', marginBottom: -1, cursor: 'pointer', marginRight: 12 }}>{tab}</button>
        ))}
      </div>

      {/* NOTEBOOKS */}
      {activeTab === 'notebooks' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>

          {/* PINNED */}
          <SectionHead label="Pinned" />
          {pinned.length === 0 ? (
            <div style={{ padding: '2px 16px 8px', fontSize: 12, color: 'var(--fg-subtle)' }}>Right-click a note or folder to pin</div>
          ) : pinned.map((item, i) => (
            <PinnedItem key={i} item={item}
              active={activeNote?.path}
              notebooks={notebooks}
              onSelect={(note) => {
                if (note) onNoteSelect(note);
                else if (item.type !== 'notebook' && item.path) onNoteSelect(item);
              }}
              onUnpin={() => onTogglePinned(item)} />
          ))}

          {/* NOTEBOOKS */}
          <SectionHead label="Notebooks" onAdd={onNewNotebook} />
          {visibleNotebooks.length === 0 && <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--fg-subtle)' }}>No notebooks yet</div>}
          {visibleNotebooks.map(nb => (
            <NotebookRow key={nb.path || nb.name} nb={nb} depth={0}
              expanded={expanded} setExpanded={setExpanded}
              hoveredNb={hoveredNb} setHoveredNb={setHoveredNb}
              renamingNb={renamingNb} setRenamingNb={setRenamingNb}
              renameVal={renameVal} setRenameVal={setRenameVal}
              addingSubTo={addingSubTo} setAddingSubTo={setAddingSubTo}
              subVal={subVal} setSubVal={setSubVal}
              dragItem={dragItem} setDragItem={setDragItem}
              dragOver={dragOver} setDragOver={setDragOver}
              activeNote={activeNote} pinned={pinned}
              showNotebookColors={showNotebookColors}
              onNoteSelect={onNoteSelect} onAddNoteToNotebook={onAddNoteToNotebook}
              onCreateSubNotebook={onCreateSubNotebook} onRenameNotebook={onRenameNotebook}
              onTogglePinned={onTogglePinned} onDeleteNotebook={onDeleteNotebook}
              onHideNote={onHideNote} onRenameNote={onRenameNote}
              onMoveNote={onMoveNote} onMoveNotebook={onMoveNotebook}
              trashedPaths={trashedPaths} archivedPaths={archivedPaths}
            />
          ))}

          {/* Root drop zone — drag here to move back to top level */}
          <div
            onDragOver={e => { if (dragItem?.type === 'notebook') { e.preventDefault(); setDragOver('__root__'); }}}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => {
              e.preventDefault(); setDragOver(null);
              if (dragItem?.type === 'notebook') {
                onMoveNotebook?.(dragItem.item, { path: '__root__' });
                setDragItem(null);
              }
            }}
            style={{
              flex: 1, minHeight: 40,
              borderRadius: 6,
              border: dragOver === '__root__' ? '2px dashed var(--border-strong)' : '2px dashed transparent',
              background: dragOver === '__root__' ? 'var(--bg-hover)' : 'transparent',
              margin: '4px 8px',
              transition: 'all 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {dragOver === '__root__' && (
              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Move to root</span>
            )}
          </div>

        </div>
      )}

      {/* TASKS */}
      {activeTab === 'tasks' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 0' }}>
          <SectionHead label="Tasks" />
          <SidebarTasks />
        </div>
      )}

      {/* RECENT */}
      {activeTab === 'recent' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <SectionHead label="Recently opened" />
          {recents.length === 0 && <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--fg-subtle)' }}>No recent notes</div>}
          {recents.map((note, i) => (
            <div key={note.path + i} onClick={() => onNoteSelect(note)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, borderRadius: 4, margin: '0 4px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Clock size={13} color="var(--fg-muted)"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{note.notebook}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archive panel (above footer) */}
      {showArchive && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <ArchivePanel
            onRestore={item => { onRestoreFromArchive?.(item); }}
            onOpen={item => { onNoteSelect(item); }}
          />
        </div>
      )}

      {/* Trash panel (above footer) */}
      {showTrash && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <TrashPanel onRestore={onRestoreFromTrash} onPermDelete={onPermanentDelete} />
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', height: 36, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <button className="btn icon" title="Settings" onClick={onOpenSettings} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={14}/></button>
        <button className="btn icon" title="Help" onClick={onOpenHelp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HelpCircle size={14}/></button>
        <button className="btn icon" title="Archive" onClick={() => { setShowArchive(s => !s); setShowTrash(false); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: showArchive ? 'var(--fg)' : 'var(--fg-muted)' }}>
          <Archive size={14}/>
        </button>
        <button className="btn icon" title="Trash" onClick={() => { setShowTrash(s => !s); setShowArchive(false); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: showTrash ? 'var(--fg)' : 'var(--fg-muted)', position: 'relative' }}>
          <Trash2 size={14}/>
          {loadTrash().length > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderRadius: '50%', background: '#e85a5a' }}/>
          )}
        </button>
        <div style={{ flex: 1, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>SpadeNotes</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-subtle)' }}>v0.1</span>
        </div>
        <button onClick={onToggleCollapse} title="Collapse sidebar" className="btn icon"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={14}/>
        </button>
      </div>
      </>)}
    </aside>
  );
}

function SectionHead({ label, onAdd }) {
  return (
    <div style={{ padding: '10px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-subtle)', fontWeight: 600 }}>
      <span>{label}</span>
      {onAdd && <button className="btn icon sm" onClick={onAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12}/></button>}
    </div>
  );
}

function NotebookRow({ nb, depth, expanded, setExpanded, hoveredNb, setHoveredNb,
  renamingNb, setRenamingNb, renameVal, setRenameVal,
  addingSubTo, setAddingSubTo, subVal, setSubVal,
  dragItem, setDragItem, dragOver, setDragOver,
  activeNote, pinned, showNotebookColors,
  onNoteSelect, onAddNoteToNotebook, onCreateSubNotebook, onRenameNotebook,
  onTogglePinned, onDeleteNotebook, onHideNote, onRenameNote,
  onMoveNote, onMoveNotebook, trashedPaths, archivedPaths,
}) {
  const color  = showNotebookColors ? colorFor(nb.name) : 'var(--fg-muted)';
  const isOpen = expanded[nb.path || nb.name];
  const isHov  = hoveredNb === (nb.path || nb.name);
  const key    = nb.path || nb.name;
  const indent = depth * 12;
  const visibleNotes = (nb.notes || []).filter(n => !trashedPaths?.has(n.path) && !archivedPaths?.has(n.path));

  return (
    <React.Fragment key={key}>
      <div
        draggable
        onDragStart={() => setDragItem({ type: 'notebook', item: nb })}
        onDragEnd={() => { setDragItem(null); setDragOver(null); }}
        onDragOver={e => { e.preventDefault(); setDragOver(key); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => {
          e.preventDefault(); setDragOver(null);
          if (!dragItem) return;
          if (dragItem.type === 'note') { onMoveNote?.(dragItem.item, nb); }
          else if (dragItem.type === 'notebook') {
            if (dragItem.item.path === nb.path) return;
            if (nb.path?.startsWith(dragItem.item.path)) return;
            onMoveNotebook?.(dragItem.item, nb);
          }
          setDragItem(null);
        }}
        onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
        onContextMenu={e => { e.preventDefault(); onTogglePinned?.({ name: nb.name, path: nb.path, type: 'notebook' }); }}
        onMouseEnter={() => setHoveredNb(key)}
        onMouseLeave={() => setHoveredNb(null)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `5px 10px 5px ${10 + indent}px`, cursor: 'pointer', borderRadius: 4, margin: '0 4px', background: dragOver === key ? 'var(--bg-active)' : isHov ? (showNotebookColors ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--bg-hover)') : (showNotebookColors ? `color-mix(in srgb, ${color} 7%, transparent)` : 'transparent'), outline: dragOver === key ? `2px solid ${color}` : 'none' }}>
        {showNotebookColors && <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />}
        <span style={{ color: 'var(--fg-subtle)', width: 12 }}>{isOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
        <Folder size={14} color={color} />
        {renamingNb === key ? (
          <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onRenameNotebook?.(nb, renameVal); setRenamingNb(null); } if (e.key === 'Escape') setRenamingNb(null); }}
            onBlur={() => { onRenameNotebook?.(nb, renameVal); setRenamingNb(null); }}
            style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', padding: '1px 4px', border: '1px solid var(--border-strong)', borderRadius: 3, background: 'var(--bg-sunken)', color: 'var(--fg)', outline: 'none' }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.name}</span>
        )}
        {isHov && renamingNb !== key ? (
          <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
            <button className="btn icon sm" title="Add note" onClick={() => onAddNoteToNotebook?.(nb.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11}/></button>
            <button className="btn icon sm" title="Add sub-notebook" onClick={() => { setAddingSubTo(key); setSubVal(''); setExpanded(e => ({ ...e, [key]: true })); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Folder size={11}/></button>
            <button className="btn icon sm" title="Rename" onClick={() => { setRenamingNb(key); setRenameVal(nb.name); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={11}/></button>
            <button className="btn icon sm" title="Pin notebook" onClick={() => onTogglePinned({ name: nb.name, path: nb.path, type: 'notebook' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5b933' }}><Star size={11}/></button>
            <button className="btn icon sm" title="Delete" onClick={() => { moveToTrash({ ...nb, type: 'notebook' }); onDeleteNotebook?.(nb); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e85a5a' }}><Trash2 size={11}/></button>
          </div>
        ) : renamingNb !== key ? (
          <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{visibleNotes.length ?? 0}</span>
        ) : null}
      </div>

      {/* Notes */}
      {isOpen && visibleNotes.map(note => (
        <NoteRow key={note.path} note={note}
          active={activeNote?.path === note.path}
          isPinned={pinned.some(p => p.path === note.path)}
          onSelect={() => onNoteSelect(note)}
          onTogglePin={() => onTogglePinned({ ...note, type: 'note' })}
          onDelete={() => { moveToTrash({ ...note, type: 'note' }); onHideNote?.(note); }}
          onArchive={() => { moveToArchive({ ...note, type: 'note' }); onHideNote?.(note); }}
          onRename={(newName) => onRenameNote?.(note, newName)}
          setDragItem={setDragItem}
          indent={indent + 20}
        />
      ))}

      {/* Sub-notebook input */}
      {addingSubTo === key && (
        <div style={{ padding: `4px 10px 4px ${32 + indent}px` }}>
          <input autoFocus value={subVal} onChange={e => setSubVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); if (subVal.trim()) onCreateSubNotebook?.(nb, subVal.trim()); setAddingSubTo(null); setSubVal(''); }
              if (e.key === 'Escape') { setAddingSubTo(null); setSubVal(''); }
            }}
            onBlur={() => { if (subVal.trim()) onCreateSubNotebook?.(nb, subVal.trim()); setAddingSubTo(null); setSubVal(''); }}
            placeholder="Sub-notebook name…"
            style={{ width: '100%', height: 26, padding: '0 8px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-sunken)', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Sub-notebooks — recursive */}
      {isOpen && (nb.subNotebooks || []).map(sub => (
        <NotebookRow key={sub.path || sub.name} nb={sub} depth={depth + 1}
          expanded={expanded} setExpanded={setExpanded}
          hoveredNb={hoveredNb} setHoveredNb={setHoveredNb}
          renamingNb={renamingNb} setRenamingNb={setRenamingNb}
          renameVal={renameVal} setRenameVal={setRenameVal}
          addingSubTo={addingSubTo} setAddingSubTo={setAddingSubTo}
          subVal={subVal} setSubVal={setSubVal}
          dragItem={dragItem} setDragItem={setDragItem}
          dragOver={dragOver} setDragOver={setDragOver}
          activeNote={activeNote} pinned={pinned}
          showNotebookColors={showNotebookColors}
          onNoteSelect={onNoteSelect} onAddNoteToNotebook={onAddNoteToNotebook}
          onCreateSubNotebook={onCreateSubNotebook} onRenameNotebook={onRenameNotebook}
          onTogglePinned={onTogglePinned} onDeleteNotebook={onDeleteNotebook}
          onHideNote={onHideNote} onRenameNote={onRenameNote}
          onMoveNote={onMoveNote} onMoveNotebook={onMoveNotebook}
          trashedPaths={trashedPaths} archivedPaths={archivedPaths}
        />
      ))}
    </React.Fragment>
  );
}

function PinnedItem({ item, active, onSelect, onUnpin, notebooks }) {
  const [hover,    setHover]    = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isNb = item.type === 'notebook';

  // Find the live notebook object to get current notes
  function findNb(nbs) {
    for (const nb of nbs || []) {
      if (nb.path === item.path || nb.name === item.name) return nb;
      const found = findNb(nb.subNotebooks);
      if (found) return found;
    }
    return null;
  }
  const liveNb = isNb ? findNb(notebooks) : null;
  const notes  = liveNb?.notes || [];

  return (
    <>
      <div
        onClick={() => { if (isNb) setExpanded(e => !e); else onSelect(); }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', cursor: 'pointer', borderRadius: 4, margin: '0 4px', fontSize: 13, background: active ? 'var(--bg-active)' : hover ? 'var(--bg-hover)' : 'transparent' }}>
        {isNb ? (
          <span style={{ color: 'var(--fg-subtle)', width: 12, display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
          </span>
        ) : null}
        {isNb
          ? <Folder size={13} style={{ color: '#f5b933', flexShrink: 0 }} />
          : <Star   size={13} style={{ color: '#f5b933', flexShrink: 0 }} />
        }
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        {hover && <button onClick={e => { e.stopPropagation(); onUnpin(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 0, display: 'flex', alignItems: 'center' }}><X size={11}/></button>}
      </div>
      {isNb && expanded && notes.length === 0 && (
        <div style={{ padding: '3px 14px 3px 44px', fontSize: 12, color: 'var(--fg-subtle)' }}>No notes</div>
      )}
      {isNb && expanded && notes.map(note => (
        <div key={note.path} onClick={() => onSelect(note)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px 4px 44px', cursor: 'pointer', borderRadius: 4, margin: '0 4px', fontSize: 13, background: active && active === note.path ? 'var(--bg-active)' : 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <FileText size={12} color="var(--fg-muted)" />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.name}</span>
        </div>
      ))}
    </>
  );
}

function NoteRow({ note, active, isPinned, onSelect, onTogglePin, onDelete, onArchive, onRename, setDragItem }) {
  const [hover,    setHover]    = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal,  setNameVal]  = useState(note.name);

  function submitRename() {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== note.name) onRename?.(trimmed);
    setRenaming(false);
  }

  return (
    <div
      draggable
      onDragStart={() => setDragItem?.({ type: 'note', item: note })}
      onDragEnd={() => setDragItem?.(null)}
      onContextMenu={e => { e.preventDefault(); onTogglePin?.(); }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 32px', cursor: 'pointer', borderRadius: 4, margin: '0 4px', fontSize: 13, background: active ? 'var(--bg-active)' : hover ? 'var(--bg-hover)' : 'transparent' }}>
      <FileText size={13} color={isPinned ? '#f5b933' : 'var(--fg-muted)'} onClick={onSelect}/>
      {renaming ? (
        <input
          autoFocus
          value={nameVal}
          onChange={e => setNameVal(e.target.value)}
          onBlur={submitRename}
          onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false); }}
          onClick={e => e.stopPropagation()}
          style={{ flex: 1, fontSize: 13, fontFamily: 'var(--sans)', padding: '1px 4px', border: '1px solid var(--border-strong)', borderRadius: 3, background: 'var(--bg-sunken)', color: 'var(--fg)', outline: 'none' }}
        />
      ) : (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={onSelect}>{note.name}</span>
      )}
      {hover && !renaming && (
        <div style={{ display: 'flex', gap: 1 }} onClick={e => e.stopPropagation()}>
          <button className="btn icon sm" title="Rename" onClick={() => { setRenaming(true); setNameVal(note.name); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={10}/></button>
          <button className="btn icon sm" title="Archive" onClick={onArchive}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}><Archive size={10}/></button>
          <button className="btn icon sm" title="Delete" onClick={onDelete}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e85a5a' }}><Trash2 size={10}/></button>
        </div>
      )}
    </div>
  );
}
