import React, { useState, useEffect, useCallback, useRef } from 'react';
import './theme.css';
import Titlebar          from './components/Titlebar.jsx';
import ActionBar         from './components/ActionBar.jsx';
import Sidebar, { moveToTrash, restoreFromTrash, restoreFromArchive } from './components/Sidebar.jsx';
import Editor            from './components/Editor.jsx';
import StatusBar         from './components/StatusBar.jsx';
import Calendar          from './components/Calendar.jsx';
import FeaturesAboutDialog from './components/FeaturesAboutDialog.jsx';
import SearchPanel       from './components/SearchPanel.jsx';
import SettingsDialog    from './components/Dialogs/SettingsDialog.jsx';
import SetupWizard       from './components/Dialogs/SetupWizard.jsx';
import NewNotebookDialog, { NewNoteDialog } from './components/Dialogs/NewNotebookDialog.jsx';
import { loadNotebooks, loadNote, saveNote, createNotebook, createNote, deleteNote, deleteNotebook, renameNote, renameNotebook, createSubNotebook, moveNote, moveNotebook, getNotesDir } from './storage/notes.js';
import { getSettings, saveSettings } from './storage/settings.js';

const DEFAULT_SETTINGS = {
  theme: 'light', fontSize: '15px', spellCheck: true,
  autoSave: true, language: 'en-US', notesDir: '',
  setupDone: false, showNotebookColors: true, showEventColors: true,
};

export default function App() {
  const [ready,        setReady]        = useState(false);
  const [showSetup,    setShowSetup]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);
  const [appSettings,  setAppSettings]  = useState(DEFAULT_SETTINGS);
  const [notebooks,    setNotebooks]    = useState([]);
  const [activeNote,   setActiveNote]   = useState(null);
  const [activeTab,    setActiveTab]    = useState('notebooks');
  const [view,         setView]         = useState('editor');
  const [readMode,     setReadMode]     = useState(false);
  const [wordCount,    setWordCount]    = useState(0);
  const [charCount,    setCharCount]    = useState(0);
  const [pageInfo,     setPageInfo]     = useState({ current: 1, total: 1 });
  const [saveStatus,   setSaveStatus]   = useState('Saved');
  const [showNewNb,    setShowNewNb]    = useState(false);
  const [showNewNote,  setShowNewNote]  = useState(false);
  const [newNoteNb,    setNewNoteNb]    = useState(null);
  const [recents,      setRecents]      = useState([]);
  const [pinned,           setPinned]          = useState([]);
  const [sidebarWidth,     setSidebarWidth]     = useState(220);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showComments,     setShowComments]     = useState(false);
  const [showCitations,    setShowCitations]    = useState(false);
  const [showHelp,         setShowHelp]         = useState(false);

  const editorRef = useRef(null);

  useEffect(() => {
    async function init() {
      const settings = await getSettings();
      const merged   = { ...DEFAULT_SETTINGS, ...settings };
      setAppSettings(merged);
      applySettings(merged);
      try {
        const r = localStorage.getItem('notesapp_recents'); if (r) setRecents(JSON.parse(r));
        const p = localStorage.getItem('notesapp_pinned');  if (p) setPinned(JSON.parse(p));
      } catch {}
      if (!merged.setupDone) setShowSetup(true);
      else await refreshNotebooks();
      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === 'Escape') setShowSearch(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function applySettings(s) {
    if ((s.theme ?? 'light') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.setProperty('--editor-font-size', s.fontSize ?? '15px');
  }

  async function handleSaveSettings(newSettings) {
    const merged = { ...appSettings, ...newSettings, setupDone: true };
    setAppSettings(merged);
    applySettings(merged);
    await saveSettings(merged);
  }

  async function refreshNotebooks() {
    const nbs = await loadNotebooks();
    setNotebooks(nbs);
    return nbs;
  }

  async function handleSetupComplete() {
    setShowSetup(false);
    await refreshNotebooks();
  }

  function toggleTheme() {
    handleSaveSettings({ theme: appSettings.theme === 'light' ? 'dark' : 'light' });
  }

  async function handleNoteSelect(note) {
    const data = await loadNote(note.path);
    setActiveNote({ ...note, content: data.content ?? '' });
    setView('editor');
    setRecents(prev => {
      const next = [{ name: note.name, path: note.path, notebook: note.notebook ?? '' }, ...prev.filter(r => r.path !== note.path)].slice(0, 10);
      try { localStorage.setItem('notesapp_recents', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function handleTogglePinned(item) {
    setPinned(prev => {
      const key    = item.path ?? item.name;
      const exists = prev.some(p => (p.path ?? p.name) === key);
      const next   = exists ? prev.filter(p => (p.path ?? p.name) !== key) : [...prev, item];
      try { localStorage.setItem('notesapp_pinned', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function handleCreateNotebook(name) {
    setShowNewNb(false);
    await createNotebook(name);
    await refreshNotebooks();
  }

  async function handleDeleteNotebook(nb) {
    if (!window.confirm(`Move notebook "${nb.name}" to trash?`)) return;
    const ok = await deleteNotebook(nb.path);
    // Update state immediately regardless of ok — also refresh from disk
    setNotebooks(prev => prev.filter(n => n.name !== nb.name));
    if (activeNote?.path?.startsWith(nb.path)) setActiveNote(null);
    await refreshNotebooks();
  }

  async function handleAddNoteToNotebook(nbName) {
    setNewNoteNb(nbName);
    setShowNewNote(true);
  }

  async function handleCreateNote(title, notebookName) {
    setShowNewNote(false);
    const nbs = await refreshNotebooks();
    const nb  = nbs.find(n => n.name === notebookName);
    if (!nb) return;
    const newNote = await createNote(nb.path, title);
    await refreshNotebooks();
    setActiveNote({ ...newNote, content: '' });
    setView('editor');
  }

  const handleSave = useCallback(async (content) => {
    if (!activeNote?.path) return;
    setSaveStatus('Saving…');
    const html = content ?? editorRef.current?.getHTML() ?? '';
    const ok   = await saveNote(activeNote.path, activeNote.name, html);
    setSaveStatus(ok ? 'Saved' : 'Save failed');
  }, [activeNote]);

  function getEditorHTML() { return editorRef.current?.getHTML() ?? ''; }
  function handleTabChange(tab) { setActiveTab(tab); }

  async function handleRestoreFromTrash(item) {
    restoreFromTrash(item);
    // File is still on disk — just remove from trash list and refresh
    await refreshNotebooks();
  }

  async function handleRestoreFromArchive(item) {
    restoreFromArchive(item);
    // File is still on disk — just remove from archive list and refresh
    // Also open the note if it's a note type
    await refreshNotebooks();
    if (item.type === 'note' && item.path) {
      const content = await loadNote(item.path);
      setActiveNote({ ...item, content: content?.content ?? '' });
      setView('editor');
    }
  }

  async function handleHideNote(note) {
    // Called when note is moved to trash or archive — just refresh sidebar
    // Do NOT delete from disk
    if (activeNote?.path === note.path) setActiveNote(null);
    await refreshNotebooks();
  }

  async function handleDeleteNote(note) {
    const ok = await deleteNote(note.path);
    if (ok) {
      if (activeNote?.path === note.path) setActiveNote(null);
      await refreshNotebooks();
    }
  }

  async function handleRenameNote(note, newName) {
    const ok = await renameNote(note.path, newName);
    if (ok) {
      if (activeNote?.path === note.path) setActiveNote(n => ({ ...n, name: newName }));
      await refreshNotebooks();
    }
  }

  async function handleRenameNotebook(nb, newName) {
    const r = await renameNotebook(nb.path, newName);
    if (r.ok) await refreshNotebooks();
  }

  async function handleCreateSubNotebook(parentNb, name) {
    await createSubNotebook(parentNb.path, name);
    await refreshNotebooks();
  }

  async function handleMoveNote(note, targetNb) {
    const r = await moveNote(note.path, targetNb.path);
    if (r.ok) {
      if (activeNote?.path === note.path) setActiveNote(n => ({ ...n, path: r.newPath }));
      await refreshNotebooks();
    }
  }

  async function handleMoveNotebook(nb, targetNb) {
    let targetPath = targetNb.path;
    if (targetPath === '__root__') {
      targetPath = await getNotesDir();
    }
    const r = await moveNotebook(nb.path, targetPath);
    if (r.ok) await refreshNotebooks();
  }

  async function handlePermanentDelete(item) {
    if (!window.confirm(`Permanently delete "${item.name}"?`)) return;
    if (item.path) await deleteNote(item.path);
    restoreFromTrash(item);
    await refreshNotebooks();
  }

  if (!ready) return null;

  const titlebarTitle = view === 'calendar'
    ? `Calendar — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : (activeNote?.name ?? 'Untitled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {showSetup    && <SetupWizard onComplete={handleSetupComplete} />}
      {showSettings && <SettingsDialog settings={appSettings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
      {showSearch   && <SearchPanel notebooks={notebooks} onNoteSelect={handleNoteSelect} onClose={() => setShowSearch(false)} />}
      {showNewNb    && <NewNotebookDialog onConfirm={handleCreateNotebook} onCancel={() => setShowNewNb(false)} />}
      {showNewNote  && <NewNoteDialog notebooks={notebooks} defaultNotebook={newNoteNb} onConfirm={handleCreateNote} onCancel={() => { setShowNewNote(false); setNewNoteNb(null); }} />}
      {showHelp     && <FeaturesAboutDialog onClose={() => setShowHelp(false)} />}

      <Titlebar title={titlebarTitle} theme={appSettings.theme} onToggleTheme={toggleTheme} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Resizable sidebar — collapsed = 48px icon strip, expanded = sidebarWidth */}
        <div style={{ display: 'flex', flexShrink: 0, position: 'relative', width: sidebarCollapsed ? 48 : sidebarWidth, transition: 'width 0.15s', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Sidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              notebooks={notebooks}
              activeNote={activeNote}
              onNoteSelect={handleNoteSelect}
              onNewNote={() => { setNewNoteNb(null); setShowNewNote(true); }}
              onNewNotebook={() => setShowNewNb(true)}
              onOpenSettings={() => setShowSettings(true)}
              onOpenSearch={() => setShowSearch(true)}
              onOpenHelp={() => setShowHelp(true)}
              onDeleteNotebook={handleDeleteNotebook}
              onAddNoteToNotebook={handleAddNoteToNotebook}
              onDeleteNote={handleDeleteNote}
              onRenameNote={handleRenameNote}
              onHideNote={handleHideNote}
              onRenameNotebook={handleRenameNotebook}
              onCreateSubNotebook={handleCreateSubNotebook}
              onMoveNote={handleMoveNote}
              onMoveNotebook={handleMoveNotebook}
              recents={recents}
              pinned={pinned}
              onTogglePinned={handleTogglePinned}
              onRestoreFromTrash={handleRestoreFromTrash}
              onPermanentDelete={handlePermanentDelete}
              onRestoreFromArchive={handleRestoreFromArchive}
              showNotebookColors={appSettings.showNotebookColors !== false}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(s => !s)}
            />
          </div>
          {!sidebarCollapsed && (
            <div
              onMouseDown={e => {
                e.preventDefault();
                const startX = e.clientX, startW = sidebarWidth;
                function onMove(ev) { setSidebarWidth(Math.max(180, Math.min(400, startW + ev.clientX - startX))); }
                function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 20, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {view === 'calendar' ? (
            <Calendar onNoteSelect={handleNoteSelect} onBack={() => setView('editor')} notebooks={notebooks} showEventColors={appSettings.showEventColors !== false} />
          ) : (
            <>
              <ActionBar
                onNew={() => { setNewNoteNb(null); setShowNewNote(true); }}
                onOpen={() => {}}
                onCalendar={() => setView('calendar')}
                onReadMode={() => setReadMode(r => !r)}
                readMode={readMode}
                activeNote={activeNote}
                getEditorHTML={getEditorHTML}
              />
              <Editor
                note={activeNote}
                onWordCount={(w, c) => { setWordCount(w); setCharCount(c); }}
                onPageInfo={setPageInfo}
                onSave={handleSave}
                setSaveStatus={setSaveStatus}
                editorRef={editorRef}
                spellCheck={appSettings.spellCheck}
                fontSize={appSettings.fontSize}
                pageMargin={appSettings.pageMargin}
                showComments={showComments}
                onToggleComments={() => setShowComments(s => !s)}
                showCitations={showCitations}
                onToggleCitations={() => setShowCitations(s => !s)}
              />
            </>
          )}
        </div>
      </div>

      <StatusBar
        wordCount={view === 'editor' ? wordCount : 0}
        charCount={view === 'editor' ? charCount : 0}
        saveStatus={view === 'editor' ? saveStatus : ''}
        pageInfo={view === 'editor' ? pageInfo : null}
        spellCheck={appSettings.spellCheck}
        onToggleSpellCheck={() => handleSaveSettings({ spellCheck: !appSettings.spellCheck })}
        language={appSettings.language}
        onLanguageChange={lang => handleSaveSettings({ language: lang })}
      />
    </div>
  );
}
