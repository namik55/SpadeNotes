import React, { useState } from 'react';
import { X, Quote, Trash2, Copy, Check, PenLine, BookOpen } from 'lucide-react';

const TYPES = ['book', 'journal', 'website'];

const LABELS = {
  author:'Author(s)', title:'Title', year:'Year',
  publisher:'Publisher', place:'Place',
  journal:'Journal name', volume:'Volume', issue:'Issue',
  pages:'Pages', doi:'DOI',
  url:'URL', siteName:'Website name',
};

const TYPE_FIELDS = {
  book:    ['author','title','year','publisher','place'],
  journal: ['author','title','year','journal','volume','issue','pages','doi'],
  website: ['author','title','year','url','siteName'],
};

// Builds a clean neutral citation string based on source type and available fields
function buildCitation(f) {
  const auth = (f.author||'').trim();
  const titl = (f.title||'').trim();
  const yr   = (f.year||'').trim();
  const pub  = (f.publisher||'').trim();
  const pl   = (f.place||'').trim();
  const jour = (f.journal||'').trim();
  const vol  = (f.volume||'').trim();
  const iss  = (f.issue||'').trim();
  const pgs  = (f.pages||'').trim();
  const doi  = (f.doi||'').trim();
  const url  = (f.url||'').trim();
  const site = (f.siteName||'').trim();
  const y    = yr || 'n.d.';
  if (!auth && !titl) return '';

  const parts = [];
  if (auth) parts.push(auth);
  if (titl) parts.push(`"${titl}"`);
  if (f.type === 'book') {
    if (pl || pub) parts.push([pl, pub].filter(Boolean).join(': '));
  } else if (f.type === 'journal') {
    if (jour) { let j = jour; if (vol) j += ` ${vol}`; if (iss) j += `(${iss})`; if (pgs) j += `, pp. ${pgs}`; parts.push(j); }
    if (doi) parts.push(`https://doi.org/${doi}`);
  } else if (f.type === 'website') {
    if (site) parts.push(site);
    if (url) parts.push(url);
  }
  if (yr) parts.push(yr);
  return parts.join(', ');
}

const EMPTY_FIELDS = { author:'',title:'',year:'',publisher:'',place:'',journal:'',volume:'',issue:'',pages:'',doi:'',url:'',siteName:'' };

function CitationForm({ onInsert }) {
  const [mode,   setMode]   = useState('structured');
  const [type,   setType]   = useState('book');
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [free,   setFree]   = useState('');
  const [copied, setCopied] = useState(false);

  const set = (k,v) => setFields(f=>({...f,[k]:v}));
  const builtText = mode === 'structured' ? buildCitation({ ...fields, type }) : '';
  const finalText = mode === 'freetext'   ? free.trim() : builtText;

  function handleCopy() {
    if (!finalText) return;
    navigator.clipboard.writeText(finalText).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  }
  function handleSave() {
    if (!finalText) return;
    onInsert(finalText, mode === 'freetext' ? 'Custom' : type);
    setFields(EMPTY_FIELDS); setFree('');
  }

  const chip = (active) => ({
    height:26, padding:'0 10px', borderRadius:'var(--radius)',
    border:`1px solid ${active?'var(--fg)':'var(--border)'}`,
    background:active?'var(--fg)':'transparent',
    color:active?'var(--bg)':'var(--fg)',
    fontSize:11, fontWeight:600, cursor:'pointer',
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'12px 14px' }}>
      {/* Mode tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:2 }}>
        <button onClick={()=>setMode('structured')} style={{ flex:1, height:30, display:'flex', alignItems:'center', justifyContent:'center', gap:5, border:'none', borderBottom:`2px solid ${mode==='structured'?'var(--fg)':'transparent'}`, background:'transparent', color:mode==='structured'?'var(--fg)':'var(--fg-muted)', fontSize:11, fontWeight:mode==='structured'?600:400, cursor:'pointer' }}>
          <BookOpen size={12}/>Structured
        </button>
        <button onClick={()=>setMode('freetext')} style={{ flex:1, height:30, display:'flex', alignItems:'center', justifyContent:'center', gap:5, border:'none', borderBottom:`2px solid ${mode==='freetext'?'var(--fg)':'transparent'}`, background:'transparent', color:mode==='freetext'?'var(--fg)':'var(--fg-muted)', fontSize:11, fontWeight:mode==='freetext'?600:400, cursor:'pointer' }}>
          <PenLine size={12}/>Free text
        </button>
      </div>

      {mode === 'freetext' ? (
        <div>
          <label style={{ fontSize:10, fontWeight:600, color:'var(--fg-muted)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>Citation text</label>
          <textarea value={free} onChange={e=>setFree(e.target.value)} placeholder="Type or paste any citation text here..."
            style={{ width:'100%', padding:'6px 8px', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--bg-sunken)', color:'var(--fg)', fontFamily:'var(--sans)', fontSize:12, outline:'none', boxSizing:'border-box', resize:'vertical', minHeight:80, lineHeight:1.5 }}/>
        </div>
      ) : (<>
        {/* Source type */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--fg-subtle)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Source type</div>
          <div style={{ display:'flex', gap:4 }}>
            {TYPES.map(t=><button key={t} onClick={()=>setType(t)} style={chip(type===t)}>
              {t==='book'?'Book':t==='journal'?'Journal':'Website'}
            </button>)}
          </div>
        </div>

        {/* Fields — all optional */}
        {(TYPE_FIELDS[type]||[]).map(key=>(
          <div key={key}>
            <label style={{ fontSize:10, fontWeight:600, color:'var(--fg-muted)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{LABELS[key]}</label>
            <input value={fields[key]} onChange={e=>set(key,e.target.value)} placeholder={LABELS[key]}
              style={{ width:'100%', height:28, padding:'0 8px', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--bg-sunken)', color:'var(--fg)', fontFamily:'var(--sans)', fontSize:12, outline:'none', boxSizing:'border-box' }}/>
          </div>
        ))}

        {/* Live preview */}
        {builtText && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--fg-subtle)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Preview</div>
            <div style={{ background:'var(--bg-sunken)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 10px', fontSize:12, lineHeight:1.6, color:'var(--fg)', wordBreak:'break-word' }}>
              {builtText}
            </div>
          </div>
        )}
      </>)}

      {/* Actions */}
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleCopy} disabled={!finalText}
          style={{ height:28, padding:'0 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-muted)', fontSize:12, cursor:finalText?'pointer':'not-allowed', opacity:finalText?1:0.4, display:'flex', alignItems:'center', gap:4 }}>
          {copied?<Check size={11}/>:<Copy size={11}/>}{copied?'Copied':'Copy'}
        </button>
        <button onClick={handleSave} disabled={!finalText}
          style={{ flex:1, height:28, borderRadius:'var(--radius)', border:'none', background:'var(--fg)', color:'var(--bg)', fontSize:12, fontWeight:600, cursor:finalText?'pointer':'not-allowed', opacity:finalText?1:0.4 }}>
          Save to list
        </button>
      </div>
    </div>
  );
}

function CitationCard({ citation, index, onDelete }) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(citation.text).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  }
  return (
    <div data-sidebar-cite={citation.id}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ margin:'0 8px 4px', borderRadius:6, border:'1px solid var(--border)', background:hover?'var(--bg-hover)':'var(--bg)', overflow:'hidden', transition:'background 0.1s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', padding:'8px 10px', gap:7 }}>
        <span style={{ width:18, height:18, borderRadius:'50%', background:'var(--bg-active)', color:'var(--fg-muted)', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{index}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:'var(--fg-muted)', fontWeight:600, marginBottom:3 }}>{citation.format}</div>
          <div style={{ fontSize:11, color:'var(--fg)', lineHeight:1.5, fontStyle:'italic', wordBreak:'break-word' }}>{citation.text}</div>
        </div>
        {hover && (
          <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
            <button onClick={handleCopy} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--fg-muted)', padding:2, display:'flex', alignItems:'center' }} title="Copy">
              {copied?<Check size={10}/>:<Copy size={10}/>}
            </button>
            <button onClick={e=>{e.stopPropagation();onDelete(citation.id);}} style={{ background:'none', border:'none', cursor:'pointer', color:'#e85a5a', padding:2, display:'flex', alignItems:'center' }} title="Delete">
              <Trash2 size={10}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CitationSidebar({ citations, onClose, onInsert, onDelete, width, onResize }) {
  const [showForm, setShowForm] = useState(true);

  return (
    <div style={{ width, flexShrink:0, background:'var(--bg-elev)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

      {/* Drag handle — left edge */}
      <div
        onMouseDown={e=>{
          e.preventDefault();
          const startX=e.clientX, startW=width;
          const onMove=ev=>onResize(Math.max(220,Math.min(520,startW-(ev.clientX-startX))));
          const onUp=()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
          window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
        }}
        style={{ position:'absolute', left:0, top:0, bottom:0, width:5, cursor:'col-resize', zIndex:10 }}
        onMouseEnter={e=>e.currentTarget.style.background='var(--border-strong)'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
      />

      {/* Header */}
      <div style={{ height:42, display:'flex', alignItems:'center', padding:'0 12px 0 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <Quote size={13} color="var(--fg-muted)" style={{ marginRight:7 }}/>
        <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--fg)' }}>
          Citations {citations.length>0&&<span style={{ fontSize:11, color:'var(--fg-muted)', fontWeight:400 }}>({citations.length})</span>}
        </span>
        <button onClick={()=>setShowForm(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--fg-muted)', fontSize:12, padding:'2px 6px', borderRadius:3, marginRight:4 }}>
          {showForm ? 'Hide form' : 'Add citation'}
        </button>
        <button className="btn icon" onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13}/></button>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Form */}
        {showForm && (
          <div style={{ borderBottom:'1px solid var(--border)' }}>
            <CitationForm onInsert={onInsert}/>
          </div>
        )}

        {/* Citation list */}
        <div style={{ padding:'8px 0' }}>
          {citations.length===0 && (
            <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--fg-subtle)', fontSize:12, lineHeight:1.6 }}>
              <Quote size={20} style={{ marginBottom:8, opacity:0.25 }}/>
              <div>No citations yet.</div>
              <div style={{ marginTop:4, opacity:0.6 }}>Add one with the form above.</div>
            </div>
          )}
          {citations.map((c,i)=>(
            <CitationCard key={c.id} citation={c} index={i+1} onDelete={onDelete}/>
          ))}
        </div>
      </div>
    </div>
  );
}
