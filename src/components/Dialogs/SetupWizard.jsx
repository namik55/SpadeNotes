import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';

export default function SetupWizard({ onComplete }) {
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);

  async function chooseFolder() {
    const chosen = await window.electronAPI.chooseFolder();
    if (chosen) setFolder(chosen);
  }

  async function handleStart() {
    setLoading(true);
    const notesDir = folder || null; // null → varsayılan Belgelerim/NotesApp
    await window.electronAPI.saveSettings({ notesDir, setupDone: true });
    onComplete(notesDir);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '0 32px', textAlign: 'center' }}>
        {/* Logo */}
        <img src="data:image/x-icon;base64,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9f/w9PX/8PT1//D09f/w9PX/8PT1//P3+P/JzM3/HB0d/wkJCf8KCgr/CgoK/woKCv8KCgrZCgoK8goKCv8KCgr/CgoK/woKCv8QEBD/rbCw//T4+f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/9Pj5/6irq/8ODw//CgoK/woKCv8KCgr/CgoK/woKCvIKCgr9CgoK/woKCv8KCgr/CgoK/wcHB/9ucHD/8fX2//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/aWpr/wcHB/8KCgr/CgoK/woKCv8KCgr/CgoK/QoKCv0KCgr/CgoK/woKCv8KCgr/CAgI/yYnJ//Lz9D/8/f4//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8/f4/8jLzP8jJCT/CAgI/woKCv8KCgr/CgoK/woKCv8KCgr9CgoK8goKCv8KCgr/CgoK/woKCv8KCgr/CAgI/2ZoaP/s8PH/8fX2//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//H19v/r7/D/YmRk/wgICP8KCgr/CgoK/woKCv8KCgr/CgoK/woKCvIKCgrZCgoK/woKCv8KCgr/CgoK/woKCv8JCQn/EhIS/5iam//y9vf/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8vb3/5SXl/8RERH/CQkJ/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK2QoKCqwKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8ICAj/ICEh/6+ys//z9/j/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//P3+P+tsLD/Hx8f/wgICP8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgqsCgoKbAoKCvsKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8ICAj/KCkp/7W4uf/z9/j/8PT1//D09f/w9PX/8PT1//D09f/w9PX/8PT1//D09f/z9/j/s7a3/ycnJ/8ICAj/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK+woKCmwKCgopCgoK3goKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8HBwf/KCkp/7Azs//y9vf/8fX1//L19f/y9fX/8vX1//L19f/x9fX/8vb3/66xsv8nJyf/BwcH/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgreCgoKKQoKCgIKCgqWCgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8HBwf/IiIi/6Wnp//n8PT/zuTv/83j7v/N4+7/zuTv/+fw9P+jpqb/ISEi/wgIB/8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCpYKCgoCCgoKAAoKCjcKCgrpCgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8ICAj/HBwc/4iTmP9yt93/UqjY/1Ko2P9yt93/h5GX/xsbG/8ICAj/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgrpCgoKNwoKCgAKCgoACgoKAgoKCokKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8ICAj/GRgX/1t7jP9Pptb/T6bW/1t6i/8YFxf/CAgI/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCokKCgoCCgoKAAAAAAAKCgoACgoKGgoKCsIKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8JCAj/FBYX/z11lP89dZP/FBYX/wkICP8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgrCCgoKGgoKCgAAAAAAAAAAAAoKCgAKCgoACgoKNgoKCtkKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8JCAj/Ehsh/xIbIf8JCAj/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK2QoKCjYKCgoACgoKAAAAAAAAAAAAAAAAAAoKCgAKCgoACgoKQgoKCtkKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCQn/CgkJ/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCtkKCgpCCgoKAAoKCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAoKCgAKCgoACgoKNgoKCsIKCgr+CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv4KCgrCCgoKNgoKCgAKCgoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoKCgAKCgoACgoKGgoKCokKCgrqCgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgrqCgoKiQoKChoKCgoACgoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKCgoACgoKAwoKCjYKCgqXCgoK3woKCvsKCgr/CgoK/woKCv8KCgr/CgoK/woKCv8KCgr/CgoK/woKCvsKCgrfCgoKlwoKCjYKCgoDCgoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgoKAAoKCgQKCgopCgoKbAoKCqwKCgrZCgoK8goKCv0KCgr9CgoK8goKCtkKCgqsCgoKbAoKCikKCgoECgoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" 
          alt="SpadeNotes"
          style={{ width: 64, height: 64, borderRadius: 14, margin: '0 auto 24px', display: 'block' }}
        />

        <h1 style={{
          fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 500,
          letterSpacing: '-0.02em', marginBottom: 8,
        }}>Welcome to SpadeNotes</h1>

        <p style={{
          color: 'var(--fg-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 36,
        }}>
          A calm, focused place for your notes.<br />
          First, choose where to save your notes.
        </p>

        {/* Folder picker */}
        <div style={{
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: '14px 16px', marginBottom: 12, textAlign: 'left',
          background: 'var(--bg-sunken)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginBottom: 6 }}>
            NOTES FOLDER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              flex: 1, fontSize: 13, color: folder ? 'var(--fg)' : 'var(--fg-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {folder || 'Documents\\NotesApp  (default)'}
            </span>
            <button className="btn ghost" onClick={chooseFolder} style={{ gap: 5, flexShrink: 0 }}>
              <FolderOpen size={13} /> Browse
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--fg-subtle)', marginBottom: 32 }}>
          You can change this later in Settings.
        </p>

        <button className="btn primary" onClick={handleStart} disabled={loading}
          style={{ width: '100%', height: 42, fontSize: 15, justifyContent: 'center' }}>
          {loading ? 'Setting up…' : 'Get started'}
        </button>
      </div>
    </div>
  );
}