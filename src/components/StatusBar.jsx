import React, { useState, useEffect, useRef } from 'react';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'tr-TR', label: 'Türkçe' },
  { code: 'es-ES', label: 'Español' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'nl-NL', label: 'Nederlands' },
];

function LangMenu({ current, onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: 'calc(100% + 4px)', right: 0,
      background: 'var(--bg)', border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
      minWidth: 160, zIndex: 200, padding: '4px 0',
    }}>
      {LANGUAGES.map(l => (
        <button key={l.code} onClick={() => { onSelect(l.code); onClose(); }} style={{
          display: 'block', width: '100%', padding: '6px 12px',
          border: 'none', textAlign: 'left', cursor: 'pointer',
          background: current === l.code ? 'var(--bg-active)' : 'transparent',
          color: 'var(--fg)', fontSize: 12, fontFamily: 'var(--sans)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = current === l.code ? 'var(--bg-active)' : 'transparent'}
        >{l.label}</button>
      ))}
    </div>
  );
}

export default function StatusBar({
  wordCount = 0, charCount = 0, saveStatus = '',
  pageInfo = null,
  spellCheck, onToggleSpellCheck,
  language = 'en-US', onLanguageChange,
}) {
  const [now,      setNow]      = useState(new Date());
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Notify Electron when language changes
  function handleLanguageChange(lang) {
    onLanguageChange?.(lang);
    window.electronAPI?.setSpellCheckLanguage?.(lang);
  }

  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const langLabel = LANGUAGES.find(l => l.code === language)?.label.split(' ')[0] ?? language;

  return (
    <div style={{
      height: 36,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 16px',
      background: 'var(--bg-elev)',
      borderTop: '1px solid var(--border)',
      fontSize: 12,
      flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', gap: 10, color: 'var(--fg-muted)' }}>
        <span>{dateStr}</span>
        <span style={{ color: 'var(--fg-subtle)' }}>·</span>
        <span>{timeStr}</span>
      </div>

      {/* Center */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'var(--fg)', fontWeight: 500 }}>
        {saveStatus && (
          <>
            <span>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: saveStatus === 'Saved' ? '#3fb78c' : '#e8a030',
                marginRight: 6,
              }} />
              {saveStatus}
            </span>
            <span style={{ color: 'var(--fg-subtle)' }}>·</span>
          </>
        )}
        {pageInfo && (
          <>
            <span style={{ color: 'var(--fg-muted)' }}>
              Page {pageInfo.current} of {pageInfo.total}
            </span>
            <span style={{ color: 'var(--fg-subtle)' }}>·</span>
          </>
        )}
        <span>Words {wordCount}</span>
        <span style={{ color: 'var(--fg-subtle)' }}>·</span>
        <span>Characters {charCount.toLocaleString()}</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', color: 'var(--fg-muted)' }}>
        {/* Spell check toggle */}
        <button
          onClick={onToggleSpellCheck}
          title={spellCheck ? 'Spell check ON — click to disable' : 'Spell check OFF — click to enable'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: spellCheck ? 'var(--fg)' : 'var(--fg-subtle)',
            fontSize: 12, fontFamily: 'var(--sans)',
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px',
            borderRadius: 3,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: spellCheck ? '#3fb78c' : 'var(--fg-subtle)',
          }} />
          ABC
        </button>

        <span style={{ color: 'var(--fg-subtle)' }}>·</span>

        {/* Language picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(o => !o)}
            title="Click to change spell check language"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--fg-muted)', fontSize: 12, fontFamily: 'var(--sans)',
              padding: '0 4px', borderRadius: 3,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {langLabel}
          </button>
          {langOpen && (
            <LangMenu
              current={language}
              onSelect={handleLanguageChange}
              onClose={() => setLangOpen(false)}
            />
          )}
        </div>

        <span style={{ color: 'var(--fg-subtle)' }}>·</span>
        <span>Markdown</span>
      </div>
    </div>
  );
}
