import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, ChevronRight } from 'lucide-react';

// Not içeriğindeki HTML taglarını temizle
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Eşleşen metni vurgula
function highlight(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before  = text.slice(0, idx);
  const match   = text.slice(idx, idx + query.length);
  const after   = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark style={{ background: '#e8c14a55', borderRadius: 2, padding: '0 1px' }}>{match}</mark>
      {after}
    </>
  );
}

// Snippet: eşleşme etrafındaki 60 karakter
function snippet(text, query) {
  if (!query.trim()) return text.slice(0, 120);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end   = Math.min(text.length, idx + query.length + 60);
  const s     = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  return s;
}

export default function SearchPanel({ notebooks, onNoteSelect, onClose }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);

    const found = [];

    for (const nb of notebooks) {
      for (const note of nb.notes ?? []) {
        // Başlık eşleşmesi
        const titleMatch = note.name.toLowerCase().includes(q.toLowerCase());

        // İçerik eşleşmesi — dosyayı oku
        let contentMatch = false;
        let contentSnippet = '';
        try {
          const raw = await window.electronAPI?.readFile(note.path);
          if (raw) {
            const parsed   = JSON.parse(raw);
            const plainText = stripHtml(parsed.content ?? '');
            if (plainText.toLowerCase().includes(q.toLowerCase())) {
              contentMatch   = true;
              contentSnippet = snippet(plainText, q);
            }
          }
        } catch {}

        if (titleMatch || contentMatch) {
          found.push({
            note,
            notebook: nb.name,
            titleMatch,
            contentMatch,
            snippet: contentSnippet,
          });
        }
      }
    }

    setResults(found);
    setLoading(false);
  }, [notebooks]);

  // Debounce — 300ms bekle
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      zIndex: 600,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 580,
          maxHeight: '70vh',
          background: 'var(--bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} color="var(--fg-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Search all notes…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: 'var(--fg)',
              fontFamily: 'var(--sans)',
            }}
          />
          {query && (
            <button className="btn icon" onClick={() => setQuery('')}><X size={14} /></button>
          )}
          <button className="btn icon" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!query && (
            <div style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--fg-muted)',
              fontSize: 13,
            }}>
              Type to search across all your notes
            </div>
          )}

          {query && loading && (
            <div style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--fg-muted)',
              fontSize: 13,
            }}>
              Searching…
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--fg-muted)',
              fontSize: 13,
            }}>
              No results for "{query}"
            </div>
          )}

          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => { onNoteSelect(r.note); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <FileText size={16} color="var(--fg-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title + notebook */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>
                    {highlight(r.note.name, query)}
                  </span>
                  <ChevronRight size={11} color="var(--fg-subtle)" />
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{r.notebook}</span>
                </div>
                {/* Snippet */}
                {r.contentMatch && r.snippet && (
                  <div style={{
                    fontSize: 12,
                    color: 'var(--fg-muted)',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {highlight(r.snippet, query)}
                  </div>
                )}
                {/* Match type badge */}
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {r.titleMatch && (
                    <span style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 3,
                      background: 'var(--bg-active)', color: 'var(--fg-muted)',
                    }}>title</span>
                  )}
                  {r.contentMatch && (
                    <span style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 3,
                      background: 'var(--bg-active)', color: 'var(--fg-muted)',
                    }}>content</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--fg-subtle)',
            display: 'flex',
            gap: 12,
          }}>
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span>↵ to open</span>
            <span>Esc to close</span>
          </div>
        )}
      </div>
    </div>
  );
}
