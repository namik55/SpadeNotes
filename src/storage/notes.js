export async function getNotesDir() {
  return window.electronAPI.getNotesDir();
}

export async function loadNotebooks() {
  const notesDir = await getNotesDir();
  await window.electronAPI.mkdir(notesDir);

  // Folders to always ignore — system/project dirs that are never notebooks
  const IGNORE = new Set(['node_modules','.git','dist','release','.vite','public',
    'electron','src','assets','.github','coverage','out','build',
    '$RECYCLE.BIN','System Volume Information']);

  async function readDir(dirPath) {
    const entries = await window.electronAPI.readDir(dirPath);
    const notebooks = [];
    for (const entry of entries) {
      if (entry === '.name' || entry.startsWith('.') || IGNORE.has(entry)) continue;
      const nbPath = await window.electronAPI.joinPath(dirPath, entry);
      const children = await window.electronAPI.readDir(nbPath);
      if (!children) continue;
      // Only treat as notebook if it contains .lnote files or a .name marker
      const hasNotes = children.some(f => f.endsWith('.lnote'));
      const hasName  = children.includes('.name');
      if (!hasNotes && !hasName) continue;
      const lnotes = children.filter(f => f.endsWith('.lnote'));
      let displayName = entry.replace(/꞉/gu, ':');
      try {
        const namePath = await window.electronAPI.joinPath(nbPath, '.name');
        const raw = await window.electronAPI.readFile(namePath);
        if (raw && raw.trim()) displayName = raw.trim();
      } catch {}
      // Recurse into sub-directories that are not .lnote files
      const subEntries = children.filter(f => !f.endsWith('.lnote') && f !== '.name' && !f.startsWith('.') && !IGNORE.has(f));
      const subNotebooks = [];
      for (const sub of subEntries) {
        const subPath = await window.electronAPI.joinPath(nbPath, sub);
        const subChildren = await window.electronAPI.readDir(subPath);
        if (!subChildren) continue;
        const subNotes = subChildren.filter(f => f.endsWith('.lnote'));
        let subName = sub.replace(/꞉/gu, ':');
        try {
          const raw = await window.electronAPI.readFile(await window.electronAPI.joinPath(subPath, '.name'));
          if (raw && raw.trim()) subName = raw.trim();
        } catch {}
        subNotebooks.push({
          name: subName,
          path: subPath,
          notes: subNotes.map(f => ({
            name: f.replace('.lnote', ''),
            path: `${subPath}\\${f}`,
            notebook: subName,
            content: '',
          })),
        });
      }
      notebooks.push({
        name: displayName,
        path: nbPath,
        notes: lnotes.map(f => ({
          name:     f.replace('.lnote', ''),
          path:     `${nbPath}\\${f}`,
          notebook: displayName,
          content:  '',
        })),
        subNotebooks,
      });
    }
    return notebooks;
  }

  return readDir(notesDir);
}

export async function loadNote(filePath) {
  const raw = await window.electronAPI.readFile(filePath);
  if (!raw) return { content: '', title: '' };
  try { return JSON.parse(raw); }
  catch { return { content: raw, title: '' }; }
}

export async function saveNote(filePath, title, content) {
  const data = { version: 1, title, content, updatedAt: new Date().toISOString() };
  return window.electronAPI.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function createNotebook(name) {
  const notesDir = await getNotesDir();
  // Replace chars Windows forbids in folder names: \ / * ? " < > |
  // Colon : replaced with visually identical modifier letter colon
  const safeName = name
    .replace(/[\/*?"<>|]/g, '')
    .replace(/:/g, '꞉')
    .replace(/^\.+|\.$/g, '')
    .trim();
  if (!safeName) return false;
  const nbPath = await window.electronAPI.joinPath(notesDir, safeName);
  const ok = await window.electronAPI.mkdir(nbPath);
  if (!ok) return false;
  // Save original display name so sidebar shows it correctly
  try {
    await window.electronAPI.writeFile(
      await window.electronAPI.joinPath(nbPath, '.name'),
      name.trim()
    );
  } catch {}
  return true;
}

export async function createNote(notebookPath, title) {
  const fileName = title.replace(/[^a-zA-Z0-9\s\-_ğüşıöçĞÜŞİÖÇ]/g, '').trim() || 'Untitled';
  const filePath = await window.electronAPI.joinPath(notebookPath, `${fileName}.lnote`);
  await saveNote(filePath, title, '');
  return { name: title, path: filePath, content: '' };
}

export async function deleteNote(filePath) {
  return window.electronAPI.deleteFile(filePath);
}

export async function deleteNotebook(nbPath) {
  return window.electronAPI.deleteFile(nbPath);
}

export async function renameNotebook(nbPath, newName) {
  const sep = nbPath.includes('\\') ? '\\' : '/';
  const parentDir = nbPath.substring(0, nbPath.lastIndexOf(sep));
  const safeName = newName
    .replace(/[\\/*?"<>|]/g, '')
    .replace(/:/g, '꞉')
    .replace(/^\.+|\.+$/g, '')
    .trim();
  if (!safeName) return { ok: false };
  const newPath = parentDir + sep + safeName;
  if (nbPath === newPath) {
    // Same disk name — just update .name file
    try {
      await window.electronAPI.writeFile(
        await window.electronAPI.joinPath(nbPath, '.name'),
        newName.trim()
      );
    } catch {}
    return { ok: true, newPath: nbPath };
  }
  const ok = await window.electronAPI.rename(nbPath, newPath);
  if (!ok) return { ok: false };
  // Save display name
  try {
    await window.electronAPI.writeFile(
      await window.electronAPI.joinPath(newPath, '.name'),
      newName.trim()
    );
  } catch {}
  return { ok: true, newPath };
}

export async function renameNote(oldPath, newTitle) {
  const sep = oldPath.includes("\\") ? "\\" : "/";
  const dir = oldPath.substring(0, oldPath.lastIndexOf(sep) + 1);
  const safeName = newTitle.replace(/[^\w\s\-ğüşıöçĞÜŞİÖÇ]/g, "").trim() || "Untitled";
  const newPath = dir + safeName + ".lnote";
  if (oldPath === newPath) return { ok: true, newPath };
  const ok = await window.electronAPI.rename(oldPath, newPath);
  if (!ok) return { ok: false };
  try {
    const raw = await window.electronAPI.readFile(newPath);
    if (raw) {
      const data = JSON.parse(raw);
      data.title = newTitle;
      data.updatedAt = new Date().toISOString();
      await window.electronAPI.writeFile(newPath, JSON.stringify(data, null, 2));
    }
  } catch {}
  return { ok: true, newPath };
}

export async function createSubNotebook(parentPath, name) {
  const sep = parentPath.includes('\\') ? '\\' : '/';
  const safeName = name
    .replace(/[\\/*?"<>|]/g, '')
    .replace(/:/g, '꞉')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .trim();
  if (!safeName) return false;
  const nbPath = parentPath + sep + safeName;
  const ok = await window.electronAPI.mkdir(nbPath);
  if (!ok) return false;
  try { await window.electronAPI.writeFile(await window.electronAPI.joinPath(nbPath, '.name'), name.trim()); } catch {}
  return true;
}

export async function moveNote(notePath, targetNbPath) {
  const sep = notePath.includes('\\') ? '\\' : '/';
  const fileName = notePath.substring(notePath.lastIndexOf(sep) + 1);
  const newPath = targetNbPath + sep + fileName;
  if (notePath === newPath) return { ok: true, newPath };
  const ok = await window.electronAPI.rename(notePath, newPath);
  return ok ? { ok: true, newPath } : { ok: false };
}

export async function moveNotebook(nbPath, targetParentPath) {
  const sep = nbPath.includes('\\') ? '\\' : '/';
  const folderName = nbPath.substring(nbPath.lastIndexOf(sep) + 1);
  const newPath = targetParentPath + sep + folderName;
  if (nbPath === newPath) return { ok: true, newPath };
  // Try rename first (fast, same-drive)
  const ok = await window.electronAPI.rename(nbPath, newPath);
  if (ok) return { ok: true, newPath };
  // Fallback: copy then delete (cross-drive or permission issue)
  const copied = await window.electronAPI.copyDir(nbPath, newPath);
  if (!copied) return { ok: false, error: 'copy failed' };
  const deleted = await window.electronAPI.deleteFile(nbPath);
  if (!deleted) return { ok: false, error: 'source not removed' };
  return { ok: true, newPath };
}