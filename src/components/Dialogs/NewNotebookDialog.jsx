import React, { useState, useEffect, useRef } from 'react';

export default function NewNotebookDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const ref = useRef();
  useEffect(() => ref.current?.focus(), []);

  function handleKey(e) {
    if (e.key === 'Enter' && name.trim()) onConfirm(name.trim());
    if (e.key === 'Escape') onCancel();
  }

  return (
    <Overlay onClose={onCancel}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        New notebook
      </h2>
      <input ref={ref} value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
        placeholder="Notebook name" style={{
          width: '100%', height: 36, padding: '0 12px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          background: 'var(--bg)', color: 'var(--fg)',
          fontFamily: 'var(--sans)', fontSize: 14, outline: 'none', marginBottom: 20,
        }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn outline" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={() => name.trim() && onConfirm(name.trim())}>Create</button>
      </div>
    </Overlay>
  );
}

export function NewNoteDialog({ notebooks, defaultNotebook, onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const [nb,   setNb]   = useState(defaultNotebook ?? notebooks[0]?.name ?? '');
  const ref = useRef();
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => { if (defaultNotebook) setNb(defaultNotebook); }, [defaultNotebook]);

  function handleKey(e) {
    if (e.key === 'Enter' && name.trim() && nb) onConfirm(name.trim(), nb);
    if (e.key === 'Escape') onCancel();
  }

  return (
    <Overlay onClose={onCancel}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        New note
      </h2>
      <label style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'block', marginBottom: 4 }}>NOTEBOOK</label>
      <select value={nb} onChange={e => setNb(e.target.value)} style={{
        width: '100%', height: 34, padding: '0 10px',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        background: 'var(--bg)', color: 'var(--fg)',
        fontFamily: 'var(--sans)', fontSize: 13, marginBottom: 12, outline: 'none',
      }}>
        {notebooks.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
      </select>
      <label style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'block', marginBottom: 4 }}>NOTE TITLE</label>
      <input ref={ref} value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
        placeholder="Note title" style={{
          width: '100%', height: 36, padding: '0 12px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          background: 'var(--bg)', color: 'var(--fg)',
          fontFamily: 'var(--sans)', fontSize: 14, outline: 'none', marginBottom: 20,
        }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn outline" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={() => name.trim() && nb && onConfirm(name.trim(), nb)}>Create</button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg)', borderRadius: 8,
        border: '1px solid var(--border)', padding: 24, width: 360,
        boxShadow: 'var(--shadow-lg)',
      }}>
        {children}
      </div>
    </div>
  );
}
