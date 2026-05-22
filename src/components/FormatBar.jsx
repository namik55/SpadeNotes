import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Underline, Strikethrough, Link, Highlighter,
  List, ListOrdered, CheckSquare, ImageIcon,
  ChevronDown, Minus, Plus, Indent, Outdent,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  MessageSquare, Quote, BookMarked,
} from 'lucide-react';
import CitationModal from './CitationModal.jsx';

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow',  color: '#FFD600' },
  { label: 'Green',   color: '#43A047' },
  { label: 'Blue',    color: '#1E88E5' },
  { label: 'Pink',    color: '#E91E63' },
  { label: 'Orange',  color: '#FB8C00' },
  { label: 'Purple',  color: '#8E24AA' },
  { label: 'Red',     color: '#E53935' },
  { label: 'Teal',    color: '#00897B' },
  { label: 'None',    color: null },
];

const TEXT_COLORS = [
  '#E53935', '#FB8C00', '#F9A825', '#43A047',
  '#00897B', '#1E88E5', '#5E35B1', '#D81B60',
  '#212121', '#757575', '#FFFFFF',
];

// Portal dropdown — renders at document.body level to avoid z-index stacking issues
function PortalMenu({ anchorRef, open, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function h(e) {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) {
        // Check if click is inside the portal menu
        const menus = document.querySelectorAll('[data-portal-menu]');
        for (const m of menus) { if (m.contains(e.target)) return; }
        onClose();
      }
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div data-portal-menu style={{
      position: 'fixed', top: pos.top, left: pos.left,
      background: 'var(--bg)', border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      zIndex: 9999,
    }}>
      {children}
    </div>,
    document.body
  );
}

export default function FormatBar({ editor, zoom, onZoomChange, onAddComment, onInsertImage, onInsertCitation, showComments, onToggleComments, commentCount, showCitations, onToggleCitations, citationCount }) {
  const [open,         setOpen]        = useState(null);
  const [activeHl,     setActiveHl]    = useState('#FFD600');
  const [currentFontSz,setFontSz]      = useState(15);
  const [linkUrl,      setLinkUrl]     = useState('');
  const [showLinkInput,setShowLinkInput] = useState(false);
  const linkInputRef = useRef();

  const headingsRef  = useRef();
  const fontsizeRef  = useRef();
  const hlRef        = useRef();
  const colorRef     = useRef();
  const alignRef     = useRef();

  function toggle(name) { setOpen(o => o === name ? null : name); }
  function close()      { setOpen(null); }

  if (!editor) return null;

  // Sync font size from editor selection
  const editorFontSize = editor.getAttributes('textStyle').fontSize;
  const displaySize = editorFontSize
    ? parseInt(editorFontSize)
    : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--editor-font-size') || '15');
  if (displaySize && displaySize !== currentFontSz) setFontSz(displaySize);

  function TBtn({ icon, title, active, onClick }) {
    return (
      <button className={`btn icon${active ? ' active' : ''}`} onClick={onClick} title={title}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </button>
    );
  }

  function applyFontSize(size) {
    setFontSz(size); close();
    const { from, to } = editor.state.selection;
    if (from !== to) editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
    else document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
  }

  function handleLink() {
    const prev = editor.getAttributes('link').href ?? '';
    setLinkUrl(prev);
    setShowLinkInput(s => !s);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }

  function submitLink() {
    setShowLinkInput(false);
    if (linkUrl === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl, target: '_blank' }).run();
    setLinkUrl('');
  }

  function handleComment() {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    onAddComment?.();
  }

  async function handleAddImage() {
    if (onInsertImage) { onInsertImage(); return; }
    let src = null;
    if (window.electronAPI?.openFile) {
      const fp = await window.electronAPI.openFile([{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }]);
      if (fp) src = `file:///${fp.replace(/\\/g, '/')}`;
    }
    if (src) editor.chain().focus().setResizableImage?.({ src }).run();
  }

  const currentAlign = ['left','center','right','justify'].find(a => editor.isActive({ textAlign: a })) ?? 'left';
  const alignIcon = { left:<AlignLeft size={14}/>, center:<AlignCenter size={14}/>, right:<AlignRight size={14}/>, justify:<AlignJustify size={14}/> }[currentAlign];
  const currentBlock = editor.isActive('heading',{level:1}) ? 'H1' : editor.isActive('heading',{level:2}) ? 'H2' : editor.isActive('heading',{level:3}) ? 'H3' : editor.isActive('heading',{level:4}) ? 'H4' : 'Body';

  return (
    <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 2, background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto', position: 'relative', zIndex: 10 }}>

      <TBtn icon={<Bold size={14}/>} title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <TBtn icon={<Italic size={14}/>} title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <TBtn icon={<Underline size={14}/>} title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <TBtn icon={<Strikethrough size={14}/>} title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />

      <div className="divider-v" />

      {/* Highlight */}
      <div style={{ display: 'flex', alignItems: 'center' }} ref={hlRef}>
        <button className={`btn icon${editor.isActive('highlight') ? ' active' : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight({ color: activeHl + '55' }).run()}
          title="Highlight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Highlighter size={14} />
        </button>
        <div style={{ width: 14, height: 4, borderRadius: 2, background: activeHl, margin: '0 1px', flexShrink: 0 }} />
        <button onClick={() => toggle('hl')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 9, padding: '0 2px', display: 'flex', alignItems: 'center' }}>▾</button>
      </div>
      <PortalMenu anchorRef={hlRef} open={open === 'hl'} onClose={close}>
        <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 26px)', gap: 4 }}>
          {HIGHLIGHT_COLORS.map(({ label, color }) => (
            <button key={label} title={label}
              onClick={() => { if (!color) editor.chain().focus().unsetHighlight().run(); else { setActiveHl(color); editor.chain().focus().setHighlight({ color: color + '55' }).run(); } close(); }}
              style={{ width: 26, height: 26, borderRadius: 4, cursor: 'pointer', background: color ?? 'transparent', border: color ? '1px solid rgba(0,0,0,0.2)' : '1.5px dashed #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {!color && '✕'}
            </button>
          ))}
        </div>
      </PortalMenu>

      {/* Text color */}
      <div ref={colorRef}>
        <button onClick={() => toggle('color')} title="Text color"
          style={{ width: 30, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)', gap: 1 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg, #E53935, #FB8C00, #43A047, #1E88E5, #8E24AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>A</span>
          <div style={{ width: 14, height: 3, borderRadius: 1, background: 'linear-gradient(90deg, #E53935, #1E88E5, #43A047)' }} />
        </button>
      </div>
      <PortalMenu anchorRef={colorRef} open={open === 'color'} onClose={close}>
        <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 26px)', gap: 4 }}>
          {TEXT_COLORS.map(color => (
            <button key={color} onClick={() => { editor.chain().focus().setColor(color).run(); close(); }}
              style={{ width: 26, height: 26, borderRadius: 4, cursor: 'pointer', background: color, border: color === '#FFFFFF' ? '1px solid #ccc' : '1px solid rgba(0,0,0,0.15)' }} />
          ))}
          <button onClick={() => { editor.chain().focus().unsetColor().run(); close(); }}
            style={{ width: 26, height: 26, borderRadius: 4, cursor: 'pointer', background: 'transparent', border: '1.5px dashed #aaa', fontSize: 12, color: '#666' }}>✕</button>
        </div>
      </PortalMenu>

      <TBtn icon={<Link size={14}/>} title="Link" active={editor.isActive('link') || showLinkInput} onClick={handleLink} />
      {showLinkInput && (
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg)', border:'1px solid var(--border-strong)', borderRadius:'var(--radius)', padding:'0 6px', height:28 }}>
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitLink(); if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); } }}
            placeholder="https://..."
            style={{ border:'none', outline:'none', background:'transparent', color:'var(--fg)', fontFamily:'var(--sans)', fontSize:12, width:180 }}
          />
          <button onClick={submitLink} style={{ border:'none', background:'var(--fg)', color:'var(--bg)', borderRadius:3, padding:'2px 8px', cursor:'pointer', fontSize:12 }}>OK</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} style={{ border:'none', background:'transparent', color:'var(--fg-muted)', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
        </div>
      )}
      <TBtn icon={<MessageSquare size={14}/>} title="Add comment" active={showComments} onClick={handleComment} />

      <div className="divider-v" />

      {/* Body */}
      <button className="btn ghost" onClick={() => editor.chain().focus().setParagraph().run()}
        style={{ fontSize: 13, height: 28, padding: '0 8px', display: 'flex', alignItems: 'center' }}>Body</button>

      {/* Headings */}
      <div ref={headingsRef}>
        <button className={`btn ghost${open==='headings'?' active':''}`} onClick={() => toggle('headings')}
          style={{ fontSize: 13, height: 28, padding: '0 8px', gap: 3, display: 'flex', alignItems: 'center' }}>
          {currentBlock === 'Body' ? 'Headings' : currentBlock} <ChevronDown size={11}/>
        </button>
      </div>
      <PortalMenu anchorRef={headingsRef} open={open==='headings'} onClose={close}>
        <div style={{ minWidth: 180, padding: '6px 0' }}>
          <div style={{ padding: '4px 12px 6px', fontSize: 11, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Apply to selection</div>
          {[{label:'Heading 1',size:'20px',level:1},{label:'Heading 2',size:'18px',level:2},{label:'Heading 3',size:'16px',level:3},{label:'Heading 4',size:'14px',level:4}].map(({label,size,level}) => (
            <button key={level} onClick={() => { editor.chain().focus().toggleHeading({level}).run(); close(); }}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'7px 14px', border:'none', background: editor.isActive('heading',{level}) ? 'var(--bg-active)':'transparent', cursor:'pointer', fontFamily:'var(--serif)', fontWeight:500, fontSize:size, color:'var(--fg)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background=editor.isActive('heading',{level})?'var(--bg-active)':'transparent'}>
              {label}<span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--fg-muted)'}}>{size}</span>
            </button>
          ))}
        </div>
      </PortalMenu>

      {/* Font size */}
      <div ref={fontsizeRef}>
        <button className="btn ghost" onClick={() => toggle('fontsize')}
          style={{ fontSize:12, height:28, padding:'0 6px', gap:2, display:'flex', alignItems:'center', fontFamily:'var(--mono)', minWidth:38 }}>
          {currentFontSz} <ChevronDown size={10}/>
        </button>
      </div>
      <PortalMenu anchorRef={fontsizeRef} open={open==='fontsize'} onClose={close}>
        <div style={{ minWidth:70, padding:'4px 0', maxHeight:220, overflowY:'auto' }}>
          {FONT_SIZES.map(size => (
            <button key={size} onClick={() => applyFontSize(size)}
              style={{ display:'block', width:'100%', padding:'4px 12px', border:'none', textAlign:'left', cursor:'pointer', background: currentFontSz===size?'var(--bg-active)':'transparent', color:'var(--fg)', fontSize:13, fontFamily:'var(--sans)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background=currentFontSz===size?'var(--bg-active)':'transparent'}>
              {size}
            </button>
          ))}
        </div>
      </PortalMenu>

      <div className="divider-v" />

      <TBtn icon={<List size={14}/>} title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <TBtn icon={<ListOrdered size={14}/>} title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <TBtn icon={<CheckSquare size={14}/>} title="Task list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />

      <div className="divider-v" />

      <TBtn icon={<Outdent size={14}/>} title="Outdent" onClick={() => editor.chain().focus().liftListItem('listItem').run()} />
      <TBtn icon={<Indent size={14}/>} title="Indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />

      <div className="divider-v" />

      {/* Alignment dropdown */}
      <div ref={alignRef}>
        <button className={`btn icon${open==='align'?' active':''}`} onClick={() => toggle('align')} title="Alignment"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34 }}>
          {alignIcon}
        </button>
      </div>
      <PortalMenu anchorRef={alignRef} open={open==='align'} onClose={close}>
        <div style={{ minWidth:130, padding:'4px 0' }}>
          {[{label:'Left',icon:<AlignLeft size={14}/>,val:'left'},{label:'Center',icon:<AlignCenter size={14}/>,val:'center'},{label:'Right',icon:<AlignRight size={14}/>,val:'right'},{label:'Justify',icon:<AlignJustify size={14}/>,val:'justify'}].map(a => (
            <button key={a.val} onClick={() => { editor.chain().focus().setTextAlign(a.val).run(); close(); }}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'6px 12px', border:'none', background: editor.isActive({textAlign:a.val})?'var(--bg-active)':'transparent', color:'var(--fg)', cursor:'pointer', fontSize:13, fontFamily:'var(--sans)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background=editor.isActive({textAlign:a.val})?'var(--bg-active)':'transparent'}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      </PortalMenu>

      <div className="divider-v" />

      <button className="btn ghost" onClick={handleAddImage}
        style={{ fontSize:13, height:28, padding:'0 8px', gap:4, display:'flex', alignItems:'center' }}>
        <ImageIcon size={13}/> Add Image
      </button>

      <div style={{ flex:1 }} />

      {/* Zoom */}
      <div style={{ display:'flex', alignItems:'center', gap:3, color:'var(--fg-muted)', fontSize:12, flexShrink:0 }}>
        <span style={{ textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10 }}>Zoom</span>
        <button className="btn icon sm" style={{ display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => onZoomChange(z => Math.max(50, z-10))}><Minus size={12}/></button>
        <span style={{ fontFamily:'var(--mono)', fontSize:12, minWidth:34, textAlign:'center' }}>{zoom}%</span>
        <button className="btn icon sm" style={{ display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => onZoomChange(z => Math.min(200, z+10))}><Plus size={12}/></button>
      </div>
    </div>
  );
}
