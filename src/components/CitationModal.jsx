import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';

const FORMATS = ['APA', 'MLA', 'Chicago', 'IEEE'];

function buildCitation(format, f) {
  const year  = f.year  || 'n.d.';
  const pages = f.pages ? `, pp. ${f.pages}` : '';
  const vol   = f.volume ? `, ${f.volume}` : '';
  const issue = f.issue  ? `(${f.issue})`  : '';
  const doi   = f.doi   ? ` https://doi.org/${f.doi}` : '';
  const place = f.place || 'Publisher';
  const pub   = f.publisher || 'Publisher';

  switch (format) {
    case 'APA':
      if (f.type === 'book') {
        return `${f.author} (${year}). *${f.title}*. ${pub}.`;
      }
      if (f.type === 'journal') {
        return `${f.author} (${year}). ${f.title}. *${f.journal}*${vol}${issue}${pages}.${doi}`;
      }
      if (f.type === 'website') {
        return `${f.author} (${year}). ${f.title}. Retrieved from ${f.url}`;
      }
      return `${f.author} (${year}). ${f.title}.`;

    case 'MLA':
      if (f.type === 'book') {
        return `${f.author}. *${f.title}*. ${place}: ${pub}, ${year}.`;
      }
      if (f.type === 'journal') {
        return `${f.author}. "${f.title}." *${f.journal}*${vol}.${issue} (${year})${pages}.`;
      }
      if (f.type === 'website') {
        return `${f.author}. "${f.title}." *${f.siteName || f.url}*, ${year}, ${f.url}.`;
      }
      return `${f.author}. "${f.title}." ${year}.`;

    case 'Chicago':
      if (f.type === 'book') {
        return `${f.author}. *${f.title}*. ${place}: ${pub}, ${year}.`;
      }
      if (f.type === 'journal') {
        return `${f.author}. "${f.title}." *${f.journal}*${vol}, no. ${f.issue || '1'} (${year})${pages}.${doi}`;
      }
      if (f.type === 'website') {
        return `${f.author}. "${f.title}." ${f.siteName || 'Website'}. Accessed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. ${f.url}.`;
      }
      return `${f.author}. "${f.title}." ${year}.`;

    case 'IEEE':
      if (f.type === 'book') {
        return `${f.author}, *${f.title}*. ${place}: ${pub}, ${year}.`;
      }
      if (f.type === 'journal') {
        return `${f.author}, "${f.title}," *${f.journal}*,${vol}${issue}${pages}, ${year}.`;
      }
      if (f.type === 'website') {
        return `${f.author}, "${f.title}," ${f.siteName || 'Online'}. [Online]. Available: ${f.url}`;
      }
      return `${f.author}, "${f.title}," ${year}.`;

    default: return '';
  }
}

export default function CitationModal({ onInsert, onClose }) {
  const [format,  setFormat]  = useState('APA');
  const [type,    setType]    = useState('book');
  const [copied,  setCopied]  = useState(false);
  const [fields,  setFields]  = useState({
    author: '', title: '', year: '', publisher: '', place: '',
    journal: '', volume: '', issue: '', pages: '', doi: '',
    url: '', siteName: '',
  });

  function set(k, v) { setFields(f => ({ ...f, [k]: v })); }

  const citation = buildCitation(format, { ...fields, type });

  function handleCopy() {
    navigator.clipboard.writeText(citation).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleInsert() {
    onInsert(citation, format);
    onClose();
  }

  const typeFields = {
    book:    ['author','title','year','publisher','place'],
    journal: ['author','title','year','journal','volume','issue','pages','doi'],
    website: ['author','title','year','url','siteName'],
  };
  const labels = {
    author: 'Author(s)', title: 'Title', year: 'Year', publisher: 'Publisher',
    place: 'Place of publication', journal: 'Journal name', volume: 'Volume',
    issue: 'Issue', pages: 'Pages (e.g. 12–24)', doi: 'DOI', url: 'URL', siteName: 'Website name',
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
      onClick={onClose}>
      <div style={{ width:520, maxHeight:'90vh', background:'var(--bg)', border:'1px solid var(--border-strong)', borderRadius:10, boxShadow:'0 16px 50px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:500, flex:1 }}>Insert Citation</span>
          <button className="btn icon" onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Format tabs */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--fg-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Format</div>
            <div style={{ display:'flex', gap:6 }}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  height:28, padding:'0 12px', borderRadius:'var(--radius)',
                  border:`1px solid ${format===f ? 'var(--fg)' : 'var(--border)'}`,
                  background: format===f ? 'var(--fg)' : 'transparent',
                  color: format===f ? 'var(--bg)' : 'var(--fg)',
                  fontSize:12, fontWeight:600, cursor:'pointer',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Source type */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--fg-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Source type</div>
            <div style={{ display:'flex', gap:6 }}>
              {['book','journal','website'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  height:28, padding:'0 12px', borderRadius:'var(--radius)',
                  border:`1px solid ${type===t ? 'var(--fg)' : 'var(--border)'}`,
                  background: type===t ? 'var(--fg)' : 'transparent',
                  color: type===t ? 'var(--bg)' : 'var(--fg)',
                  fontSize:12, cursor:'pointer', textTransform:'capitalize',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(typeFields[type] || []).map(key => (
              <div key={key}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--fg-muted)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {labels[key]}
                </label>
                <input
                  value={fields[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder={labels[key]}
                  style={{ width:'100%', height:32, padding:'0 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--bg-sunken)', color:'var(--fg)', fontFamily:'var(--sans)', fontSize:13, outline:'none', boxSizing:'border-box' }}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          {citation.trim() && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--fg-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Preview</div>
              <div style={{ background:'var(--bg-sunken)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:13, lineHeight:1.6, color:'var(--fg)', fontStyle:'italic' }}>
                {citation}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'10px 18px', display:'flex', gap:8, justifyContent:'flex-end', flexShrink:0 }}>
          <button className="btn ghost" onClick={handleCopy} style={{ gap:5, display:'flex', alignItems:'center' }}>
            {copied ? <Check size={13}/> : <Copy size={13}/>}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleInsert} disabled={!citation.trim()}>Insert</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
