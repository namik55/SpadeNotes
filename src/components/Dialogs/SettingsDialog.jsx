import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Type, FolderOpen, CheckSquare, Globe, Palette, AlignLeft, Maximize, Keyboard } from 'lucide-react';

const FONT_SIZES   = ['13px','14px','15px','16px','17px','18px'];
const INDENT_SIZES = [20, 24, 28, 32, 40, 48, 56, 64];
const LANGUAGES    = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'tr-TR', label: 'Türkçe' },
  { code: 'es-ES', label: 'Español' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'nl-NL', label: 'Nederlands' },
];

export const DEFAULT_SHORTCUTS = {
  newNote:        { label: 'New note',           default: 'Ctrl+N',        keys: 'Ctrl+N' },
  newNotebook:    { label: 'New notebook',        default: 'Ctrl+Shift+N',  keys: 'Ctrl+Shift+N' },
  save:           { label: 'Save',               default: 'Ctrl+S',        keys: 'Ctrl+S' },
  search:         { label: 'Search',             default: 'Ctrl+F',        keys: 'Ctrl+F' },
  bold:           { label: 'Bold',               default: 'Ctrl+B',        keys: 'Ctrl+B' },
  italic:         { label: 'Italic',             default: 'Ctrl+I',        keys: 'Ctrl+I' },
  underline:      { label: 'Underline',          default: 'Ctrl+U',        keys: 'Ctrl+U' },
  toggleCalendar: { label: 'Open calendar',      default: 'Ctrl+Shift+C',  keys: 'Ctrl+Shift+C' },
  zoomIn:         { label: 'Zoom in',            default: 'Ctrl+=',        keys: 'Ctrl+=' },
  zoomOut:        { label: 'Zoom out',           default: 'Ctrl+-',        keys: 'Ctrl+-' },
  toggleComments: { label: 'Toggle comments',    default: 'Ctrl+Shift+M',  keys: 'Ctrl+Shift+M' },
  insertCitation: { label: 'Insert citation',    default: 'Ctrl+Shift+T',  keys: 'Ctrl+Shift+T' },
};

export default function SettingsDialog({ settings, onSave, onClose }) {
  const [tab,             setTab]             = useState('appearance');
  const [theme,           setTheme]           = useState(settings.theme              ?? 'light');
  const [fontSize,        setFontSize]        = useState(settings.fontSize           ?? '15px');
  const [spellCheck,      setSpellCheck]      = useState(settings.spellCheck         ?? true);
  const [language,        setLanguage]        = useState(settings.language           ?? 'en-US');
  const [notesDir,        setNotesDir]        = useState(settings.notesDir           ?? '');
  const [showNbColors,    setShowNbColors]    = useState(settings.showNotebookColors ?? true);
  const [showEventColors, setShowEventColors] = useState(settings.showEventColors    ?? true);
  const [lineSpacing,     setLineSpacing]     = useState(settings.lineSpacing        ?? 1.7);
  const [indentSize,      setIndentSize]      = useState(settings.indentSize         ?? 40);
  const [marginTop,       setMarginTop]       = useState(settings.pageMargin?.top    ?? 56);
  const [marginBottom,    setMarginBottom]    = useState(settings.pageMargin?.bottom ?? 56);
  const [marginLeft,      setMarginLeft]      = useState(settings.pageMargin?.left   ?? 72);
  const [marginRight,     setMarginRight]     = useState(settings.pageMargin?.right  ?? 72);
  const [shortcuts,       setShortcuts]       = useState(() => {
    const saved = settings.shortcuts ?? {};
    return Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUTS).map(([k, v]) => [k, { ...v, keys: saved[k]?.keys ?? v.default }])
    );
  });

  function handleSave() {
    onSave({
      theme, fontSize, spellCheck, language, notesDir,
      showNotebookColors: showNbColors, showEventColors,
      lineSpacing, indentSize,
      pageMargin: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
      shortcuts: Object.fromEntries(Object.entries(shortcuts).map(([k,v]) => [k, { keys: v.keys }])),
    });
    onClose();
  }

  async function chooseFolder() {
    if (!window.electronAPI) return;
    const chosen = await window.electronAPI.chooseFolder();
    if (chosen) setNotesDir(chosen);
  }

  function setShortcutKey(action, keys) {
    setShortcuts(s => ({ ...s, [action]: { ...s[action], keys } }));
  }

  function resetShortcuts() {
    setShortcuts(Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUTS).map(([k, v]) => [k, { ...v, keys: v.default }])
    ));
  }

  const tabs = [
    { key: 'appearance', label: 'Appearance' },
    { key: 'editor',     label: 'Editor' },
    { key: 'shortcuts',  label: 'Shortcuts' },
    { key: 'storage',    label: 'Storage' },
  ];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:580, maxHeight:'90vh', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--shadow-lg)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h2 style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:500, flex:1 }}>Settings</h2>
          <button className="btn icon" onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15}/></button>
        </div>

        <div style={{ display:'flex', flex:1, minHeight:0 }}>
          {/* Tab sidebar */}
          <div style={{ width:148, borderRight:'1px solid var(--border)', padding:'8px 0', flexShrink:0 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display:'block', padding:'8px 16px', textAlign:'left', fontSize:13, fontWeight:500,
                color: tab===t.key ? 'var(--fg)' : 'var(--fg-muted)',
                background: tab===t.key ? 'var(--bg-active)' : 'transparent',
                border:'none', cursor:'pointer', borderRadius:4, margin:'0 4px', width:'calc(100% - 8px)',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>

            {/* ── APPEARANCE ── */}
            {tab === 'appearance' && (
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                <Section icon={<Moon size={14}/>} title="Theme">
                  <div style={{ display:'flex', gap:8 }}>
                    {['light','dark'].map(t => (
                      <button key={t} onClick={() => setTheme(t)} style={{ flex:1, height:72, borderRadius:'var(--radius)', border:`2px solid ${theme===t?'var(--fg)':'var(--border)'}`, background: t==='dark'?'#0c0c0c':'#ffffff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <div style={{ width:32, height:20, borderRadius:3, background: t==='dark'?'#333':'#f0f0f0', border:`1px solid ${t==='dark'?'#444':'#ddd'}` }}/>
                        <span style={{ fontSize:12, fontWeight:500, color: t==='dark'?'#fff':'#000', textTransform:'capitalize' }}>{t}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section icon={<Type size={14}/>} title="Editor font size">
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {FONT_SIZES.map(s => (
                      <button key={s} onClick={() => setFontSize(s)} style={{ height:32, padding:'0 14px', borderRadius:'var(--radius)', border:`1px solid ${fontSize===s?'var(--fg)':'var(--border)'}`, background: fontSize===s?'var(--fg)':'transparent', color: fontSize===s?'var(--bg)':'var(--fg)', fontSize:s, cursor:'pointer', fontFamily:'var(--sans)' }}>Aa</button>
                    ))}
                  </div>
                </Section>

                <Section icon={<Palette size={14}/>} title="Colors">
                  <Toggle label="Notebook colors" description="Show coloured tags for notebooks in the sidebar." value={showNbColors} onChange={setShowNbColors} />
                  <div style={{ marginTop:14 }}>
                    <Toggle label="Calendar event colors" description="Show coloured dots for calendar events." value={showEventColors} onChange={setShowEventColors} />
                  </div>
                </Section>
              </div>
            )}

            {/* ── EDITOR ── */}
            {tab === 'editor' && (
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                <Section icon={<CheckSquare size={14}/>} title="Spell check">
                  <Toggle label="Enable spell check" description="Underlines misspelled words as you type." value={spellCheck} onChange={setSpellCheck} />
                </Section>

                <Section icon={<Globe size={14}/>} title="Spell check language">
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width:'100%', height:34, padding:'0 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--fg)', fontFamily:'var(--sans)', fontSize:13, outline:'none' }}>
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </Section>

                <Section icon={<CheckSquare size={14}/>} title="Line spacing">
                  <p style={{ fontSize:12, color:'var(--fg-muted)', marginBottom:10, lineHeight:1.5 }}>Controls space between lines and after each paragraph.</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                    {[1.2,1.4,1.5,1.6,1.7,1.8,2.0,2.2,2.5].map(s => (
                      <button key={s} onClick={() => setLineSpacing(s)} style={{ height:30, padding:'0 10px', borderRadius:'var(--radius)', border:`1px solid ${lineSpacing===s?'var(--fg)':'var(--border)'}`, background: lineSpacing===s?'var(--fg)':'transparent', color: lineSpacing===s?'var(--bg)':'var(--fg)', fontSize:12, cursor:'pointer', fontFamily:'var(--mono)' }}>{s}</button>
                    ))}
                    <button onClick={() => setLineSpacing(1.7)} style={{ height:30, padding:'0 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-muted)', fontSize:12, cursor:'pointer' }}>↺ Default</button>
                  </div>
                </Section>

                <Section icon={<AlignLeft size={14}/>} title="Indent size">
                  <p style={{ fontSize:12, color:'var(--fg-muted)', marginBottom:10, lineHeight:1.5 }}>Pixel width added per Tab press or Indent button click.</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                    {INDENT_SIZES.map(s => (
                      <button key={s} onClick={() => setIndentSize(s)} style={{ height:30, padding:'0 12px', borderRadius:'var(--radius)', border:`1px solid ${indentSize===s?'var(--fg)':'var(--border)'}`, background: indentSize===s?'var(--fg)':'transparent', color: indentSize===s?'var(--bg)':'var(--fg)', fontSize:13, cursor:'pointer', fontFamily:'var(--mono)' }}>{s}px</button>
                    ))}
                    <button onClick={() => setIndentSize(40)} style={{ height:30, padding:'0 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-muted)', fontSize:12, cursor:'pointer' }}>↺ Default</button>
                  </div>
                </Section>

                <Section icon={<Maximize size={14}/>} title="Page margins">
                  <p style={{ fontSize:12, color:'var(--fg-muted)', marginBottom:12, lineHeight:1.5 }}>White space inside the page canvas (pixels).</p>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                    <button onClick={() => { setMarginTop(56); setMarginBottom(56); setMarginLeft(72); setMarginRight(72); }} style={{ height:28, padding:'0 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-muted)', fontSize:12, cursor:'pointer' }}>↺ Reset to default</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[{label:'Top',value:marginTop,set:setMarginTop},{label:'Bottom',value:marginBottom,set:setMarginBottom},{label:'Left',value:marginLeft,set:setMarginLeft},{label:'Right',value:marginRight,set:setMarginRight}].map(({label,value,set}) => (
                      <div key={label}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--fg-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <button onClick={() => set(v => Math.max(8,v-8))} style={{ width:28, height:28, border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'transparent', cursor:'pointer', color:'var(--fg)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                          <input type="number" min={8} max={200} value={value} onChange={e => set(Math.max(8,Math.min(200,parseInt(e.target.value)||8)))} style={{ width:54, height:28, textAlign:'center', border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'var(--bg-sunken)', color:'var(--fg)', fontFamily:'var(--mono)', fontSize:13, outline:'none' }}/>
                          <button onClick={() => set(v => Math.min(200,v+8))} style={{ width:28, height:28, border:'1px solid var(--border)', borderRadius:'var(--radius)', background:'transparent', cursor:'pointer', color:'var(--fg)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                          <span style={{ fontSize:11, color:'var(--fg-muted)' }}>px</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* ── SHORTCUTS ── */}
            {tab === 'shortcuts' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontSize:12, color:'var(--fg-muted)', lineHeight:1.5 }}>Click a shortcut to record a new one. Press the key combination, then click away to save.</p>
                  <button onClick={resetShortcuts} style={{ height:28, padding:'0 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-muted)', fontSize:12, cursor:'pointer', flexShrink:0 }}>↺ Reset all</button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {Object.entries(shortcuts).map(([action, sc]) => (
                    <ShortcutRow key={action} action={action} shortcut={sc} onChange={keys => setShortcutKey(action, keys)} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STORAGE ── */}
            {tab === 'storage' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <Section icon={<FolderOpen size={14}/>} title="Notes folder">
                  <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', background:'var(--bg-sunken)', marginBottom:8 }}>
                    <div style={{ fontSize:12, color:'var(--fg-subtle)', marginBottom:4 }}>CURRENT LOCATION</div>
                    <div style={{ fontSize:13, color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{notesDir || 'Documents\\NotesApp (default)'}</div>
                  </div>
                  <button className="btn ghost" onClick={chooseFolder} style={{ gap:5, display:'flex', alignItems:'center' }}>
                    <FolderOpen size={13}/> Change folder
                  </button>
                  <p style={{ fontSize:12, color:'var(--fg-muted)', marginTop:8, lineHeight:1.5 }}>⚠️ Changing the folder will not move existing notes.</p>
                </Section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'12px 20px', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── ShortcutRow ────────────────────────────────────────────────────────────
function ShortcutRow({ action, shortcut, onChange }) {
  const [recording, setRecording] = useState(false);
  const [display,   setDisplay]   = useState(shortcut.keys);
  const ref = useRef();

  useEffect(() => { setDisplay(shortcut.keys); }, [shortcut.keys]);

  function startRecord() {
    setRecording(true);
    setDisplay('…');
    setTimeout(() => ref.current?.focus(), 20);
  }

  function handleKeyDown(e) {
    e.preventDefault();
    const parts = [];
    if (e.ctrlKey  || e.metaKey) parts.push('Ctrl');
    if (e.altKey)                parts.push('Alt');
    if (e.shiftKey)              parts.push('Shift');
    const key = e.key.length === 1 ? e.key.toUpperCase()
              : e.key === 'Escape'  ? null
              : e.key;
    if (!key || key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') return;
    if (e.key === 'Escape') { setRecording(false); setDisplay(shortcut.keys); return; }
    parts.push(key);
    const combo = parts.join('+');
    setDisplay(combo);
    onChange(combo);
    setRecording(false);
  }

  return (
    <div style={{ display:'flex', alignItems:'center', padding:'8px 4px', borderBottom:'1px solid var(--border)' }}>
      <span style={{ flex:1, fontSize:13, color:'var(--fg)' }}>{shortcut.label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button
          ref={ref}
          onClick={startRecord}
          onKeyDown={recording ? handleKeyDown : undefined}
          onBlur={() => { if (recording) { setRecording(false); setDisplay(shortcut.keys); } }}
          style={{
            minWidth:110, height:28, padding:'0 10px', borderRadius:'var(--radius)',
            border: `1px solid ${recording ? 'var(--fg)' : 'var(--border)'}`,
            background: recording ? 'var(--bg-active)' : 'var(--bg-sunken)',
            color: recording ? 'var(--fg)' : 'var(--fg-muted)',
            fontFamily:'var(--mono)', fontSize:12, cursor:'pointer', textAlign:'center',
            outline: recording ? '2px solid var(--fg)' : 'none', outlineOffset:1,
          }}
        >
          {recording ? '⏺ ' + display : display}
        </button>
        {shortcut.keys !== shortcut.default && (
          <button onClick={() => { onChange(shortcut.default); setDisplay(shortcut.default); }}
            style={{ height:26, padding:'0 7px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--fg-subtle)', fontSize:11, cursor:'pointer' }}>↺</button>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        <span style={{ color:'var(--fg-muted)' }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--fg)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{label}</div>
        {description && <div style={{ fontSize:12, color:'var(--fg-muted)', lineHeight:1.4 }}>{description}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width:40, height:22, borderRadius:11, background: value?'var(--fg)':'var(--bg-active)', border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 150ms' }}>
        <span style={{ position:'absolute', top:3, left: value?21:3, width:16, height:16, borderRadius:'50%', background: value?'var(--bg)':'var(--fg-muted)', transition:'left 150ms' }}/>
      </button>
    </div>
  );
}
