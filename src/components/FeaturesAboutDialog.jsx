import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, CheckSquare, Search, MessageSquare, Link, ImageIcon, BookOpen, Keyboard, Coffee } from 'lucide-react';

const FEATURES = [
  { icon: <FileText size={15}/>,     title: 'Rich text editor',     desc: 'Bold, italic, underline, strikethrough, headings H1–H4, font sizes, text colours, and highlights.' },
  { icon: <BookOpen size={15}/>,     title: 'Notebooks & notes',    desc: 'Organise notes into notebooks with colour-coded tags. Pin favourites and access recent notes instantly.' },
  { icon: <Calendar size={15}/>,     title: 'Calendar',             desc: 'Attach notes and events to specific dates. Colourful event chips, quick notes, and month navigation.' },
  { icon: <CheckSquare size={15}/>,  title: 'Task lists',           desc: 'Create tasks and subtasks with checkboxes directly inside notes or in the sidebar task panel.' },
  { icon: <Search size={15}/>,       title: 'Full-text search',     desc: 'Search across all notebooks and notes instantly with Ctrl+F.' },
  { icon: <MessageSquare size={15}/>,title: 'Comments',             desc: 'Highlight any text and add a comment. All comments appear in the comments sidebar in document order.' },
  { icon: <Link size={15}/>,         title: 'Links & citations',    desc: 'Insert hyperlinks and formatted citations in APA, MLA, Chicago, and IEEE styles.' },
  { icon: <ImageIcon size={15}/>,    title: 'Images',               desc: 'Insert images from disk. Resize by dragging the corner handle or right-click for size and alignment presets.' },
  { icon: <Keyboard size={15}/>,     title: 'Custom shortcuts',     desc: 'Define your own keyboard shortcuts for common actions in Settings → Shortcuts.' },
];

export default function FeaturesAboutDialog({ onClose }) {
  const [tab, setTab] = useState('features');

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
      onClick={onClose}>
      <div style={{ width:500, maxHeight:'84vh', background:'var(--bg)', border:'1px solid var(--border-strong)', borderRadius:10, boxShadow:'0 16px 50px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight:500, flex:1 }}>NotesApp</span>
          <button className="btn icon" onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {['features','about'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'8px 20px', border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background:'transparent', textTransform:'capitalize',
              color: tab===t ? 'var(--fg)' : 'var(--fg-muted)',
              borderBottom: tab===t ? '2px solid var(--fg)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Features */}
          {tab === 'features' && (
            <div style={{ padding:'8px 0' }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display:'flex', gap:12, padding:'10px 18px', borderBottom: i < FEATURES.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:30, height:30, borderRadius:6, background:'var(--bg-active)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--fg-muted)' }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--fg)', marginBottom:2 }}>{f.title}</div>
                    <div style={{ fontSize:12, color:'var(--fg-muted)', lineHeight:1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* About */}
          {tab === 'about' && (
            <div style={{ padding:'28px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:16 }}>
              <div style={{ width:64, height:64, borderRadius:14, background:'var(--bg-active)', border:'1.5px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>✎</div>
              <div>
                <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, marginBottom:4 }}>NotesApp</div>
                <div style={{ fontSize:12, color:'var(--fg-muted)', fontFamily:'var(--mono)' }}>v0.1.0 — Electron + React</div>
              </div>
              <p style={{ fontSize:13, color:'var(--fg-muted)', lineHeight:1.7, maxWidth:360 }}>
                A calm, focused writing space for students and researchers. Built as an alternative to complex word processors for seminar papers, lecture notes, and personal projects.
              </p>
              <div style={{ width:'100%', borderTop:'1px solid var(--border)', paddingTop:16, display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
                <div style={{ fontSize:12, color:'var(--fg-muted)' }}>Built with Electron, React, and Tiptap</div>
                <div style={{ fontSize:12, color:'var(--fg-muted)' }}>© 2025 — Open source, MIT licence</div>
                <a href="#" onClick={e => { e.preventDefault(); window.electronAPI && window.open?.('https://buymeacoffee.com'); }}
                  style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, padding:'7px 16px', borderRadius:'var(--radius)', background:'#FFDD00', color:'#000', fontSize:13, fontWeight:600, textDecoration:'none', cursor:'pointer' }}>
                  <Coffee size={14}/> Buy me a coffee
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
