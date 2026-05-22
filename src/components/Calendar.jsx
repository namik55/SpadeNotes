import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const NOTE_COLORS = ['#e85a5a','#e89043','#e8c244','#7fc454','#3aa6c6','#7c5fd6'];

export default function Calendar({ onNoteSelect, onBack, notebooks = [], showEventColors = true }) {
  const today = new Date();
  const [current,        setCurrent]        = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected,       setSelected]       = useState(today);
  const [events,         setEvents]         = useState({});
  const [quickNote,      setQuickNote]      = useState('');
  const [editingEvt,     setEditingEvt]     = useState(null);
  const [editText,       setEditText]       = useState('');
  const [editColor,      setEditColor]      = useState(NOTE_COLORS[0]);
  const [dateInput,      setDateInput]      = useState(false);
  const [dateStr,        setDateStr]        = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('notesapp_calendar_events');
      if (saved) setEvents(JSON.parse(saved));
    } catch {}
  }, []);

  function saveEvents(next) {
    setEvents(next);
    try { localStorage.setItem('notesapp_calendar_events', JSON.stringify(next)); } catch {}
  }

  function prevMonth() { setCurrent(c => c.month === 0 ? { year: c.year-1, month: 11 } : { year: c.year, month: c.month-1 }); }
  function nextMonth() { setCurrent(c => c.month === 11 ? { year: c.year+1, month: 0 } : { year: c.year, month: c.month+1 }); }
  function goToday()   { setCurrent({ year: today.getFullYear(), month: today.getMonth() }); setSelected(today); }

  function addEvent(date, title, color, type = 'event', time = '') {
    if (!title.trim()) return;
    const key  = dateKey(date);
    const next = { ...events };
    if (!next[key]) next[key] = [];
    next[key] = [...next[key], { id: Date.now(), title: title.trim(), color: color ?? NOTE_COLORS[0], type, time }];
    saveEvents(next);
  }

  function deleteEvent(date, id) {
    const key  = dateKey(date);
    const next = { ...events };
    if (next[key]) { next[key] = next[key].filter(e => e.id !== id); if (!next[key].length) delete next[key]; }
    saveEvents(next);
  }

  function updateEvent(key, id, text, color) {
    const next = { ...events };
    if (next[key]) next[key] = next[key].map(e => e.id === id ? { ...e, title: text, ...(color ? { color } : {}) } : e);
    saveEvents(next);
    setEditingEvt(null);
  }

  function handleDateSubmit() {
    const parts = dateStr.split(/[./\-]/).map(Number);
    let d;
    if (parts.length === 3) {
      d = new Date(parts[2], parts[1]-1, parts[0]);
      if (isNaN(d.getTime())) d = new Date(parts[2], parts[0]-1, parts[1]);
    }
    if (d && !isNaN(d.getTime())) { setCurrent({ year: d.getFullYear(), month: d.getMonth() }); setSelected(d); }
    setDateInput(false); setDateStr('');
  }

  const { year, month } = current;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const daysInPrev  = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false });

  const selectedKey    = dateKey(selected);
  const selectedEvents = events[selectedKey] ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ height: 50, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>

        <button className="btn ghost" onClick={onBack} style={{ gap: 5, display: 'flex', alignItems: 'center' }}>
          <BookOpen size={13} /> To Notebooks
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        {dateInput ? (
          <input autoFocus value={dateStr} onChange={e => setDateStr(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleDateSubmit(); if (e.key === 'Escape') { setDateInput(false); setDateStr(''); }}}
            onBlur={handleDateSubmit} placeholder="DD/MM/YYYY"
            style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', background: 'transparent', color: 'var(--fg)', width: 180 }}
          />
        ) : (
          <h2 onClick={() => setDateInput(true)} title="Click to go to a specific date"
            style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {MONTHS[month]}
            <span style={{ color: 'var(--fg-muted)', fontSize: 18 }}>{year}</span>
          </h2>
        )}

        <button className="btn outline sm" onClick={goToday}>Today</button>
        <button className="btn icon" onClick={prevMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={14} /></button>
        <button className="btn icon" onClick={nextMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={14} /></button>

        <div style={{ flex: 1 }} />
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elev)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${cells.length / 7}, 1fr)`, overflow: 'hidden' }}>
          {cells.map((cell, idx) => {
            if (!cell.current) return (
              <div key={idx} style={{ borderRight: (idx+1)%7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length-7 ? '1px solid var(--border)' : 'none', padding: '8px 10px', background: 'var(--bg-sunken)' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>{cell.day}</span>
              </div>
            );

            const cellDate = new Date(year, month, cell.day);
            const key      = dateKey(cellDate);
            const cellEvts = events[key] ?? [];
            const isToday  = isSameDay(cellDate, today);
            const isSel    = isSameDay(cellDate, selected);

            return (
              <div key={idx} onClick={() => setSelected(cellDate)}
                style={{ borderRight: (idx+1)%7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length-7 ? '1px solid var(--border)' : 'none', padding: '8px 10px', cursor: 'pointer', background: isSel ? 'var(--bg-active)' : 'var(--bg)', overflow: 'hidden' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg)'; }}
              >
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--bg)' : 'var(--fg)', background: isToday ? 'var(--fg)' : 'transparent', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{cell.day}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-subtle)', fontWeight: 500 }}>{DAYS[(cellDate.getDay() + 6) % 7]}</span>
                </div>
                {cellEvts.slice(0, 3).map(evt => {
                  const c = evt.color ?? NOTE_COLORS[0];
                  const icon = evt.type === 'attach' ? '📎' : evt.type === 'quick' ? '·' : '◆';
                  return (
                    <div key={evt.id} style={{ fontSize: 11, padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: showEventColors ? (c + '33') : 'var(--bg-active)', borderLeft: showEventColors ? `3px solid ${c}` : '3px solid var(--fg-muted)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 8, opacity: 0.7, flexShrink: 0 }}>{icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.time ? `${evt.time} ` : ''}{evt.title}</span>
                    </div>
                  );
                })}
                {cellEvts.length > 3 && <div style={{ fontSize: 10, color: 'var(--fg-muted)', paddingLeft: 4 }}>+{cellEvts.length - 3} more</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', background: 'var(--bg-elev)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', minWidth: 120 }}>
            {selected.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <input
            value={quickNote} onChange={e => setQuickNote(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && quickNote.trim()) {
                e.preventDefault();
                addEvent(selected, quickNote.trim(), NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], 'quick', '');
                setQuickNote('');
              }
            }}
            placeholder="Add a quick note for this date… (Enter)"
            style={{ flex: 1, height: 30, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }}
          />
        </div>

        {selectedEvents.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedEvents.map(evt => {
              const c = evt.color ?? NOTE_COLORS[0];
              const isEditing = editingEvt?.id === evt.id;
              return (
                <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: showEventColors ? (c + '22') : 'var(--bg-active)', border: `1px solid ${showEventColors ? c : 'var(--border)'}`, borderRadius: 'var(--radius)', fontSize: 12 }}>
                  {/* Type icon */}
                  <span style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>
                    {evt.type === 'attach' ? '📎' : evt.type === 'quick' ? '·' : '◆'}
                  </span>
                  {showEventColors && (
                    <span onClick={() => { const i = (NOTE_COLORS.indexOf(c) + 1) % NOTE_COLORS.length; updateEvent(selectedKey, evt.id, evt.title, NOTE_COLORS[i]); }}
                      title="Click to change color"
                      style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, cursor: 'pointer' }}
                    />
                  )}
                  {isEditing ? (
                    <input autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); updateEvent(selectedKey, evt.id, editText, editColor); } if (e.key === 'Escape') setEditingEvt(null); }}
                      onBlur={() => updateEvent(selectedKey, evt.id, editText, editColor)}
                      style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 12, width: 140 }}
                    />
                  ) : (
                    <span onClick={() => { setEditingEvt({ key: selectedKey, id: evt.id }); setEditText(evt.title); setEditColor(c); }}
                      style={{ cursor: 'text', color: 'var(--fg)' }} title="Click to edit">
                      {evt.time && <span style={{ color: 'var(--fg-muted)', marginRight: 4 }}>{evt.time}</span>}
                      {evt.title}
                    </span>
                  )}
                  <button onClick={() => deleteEvent(selected, evt.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
