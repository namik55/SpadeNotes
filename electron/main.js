const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const isDev = process.env.NODE_ENV === 'development';
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try { if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch {}
  return {};
}
function saveSettings(data) {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch {}
}

let win;
let trashFn = null;

async function getTrash() {
  if (trashFn) return trashFn;
  const mod = await import('trash');
  trashFn = mod.default;
  return trashFn;
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'spade-notes-logo.ico')
    : path.join(__dirname, '..', 'assets', 'spade-notes-logo.ico');

  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    backgroundColor: '#fafafa', title: 'SpadeNotes',
    frame: false,
    center: true,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, spellcheck: true,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  win.setMenu(null);
  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();
    if (params.misspelledWord) {
      params.dictionarySuggestions.slice(0, 6).forEach(s => {
        menu.append(new MenuItem({ label: s, click: () => win.webContents.replaceMisspelling(s) }));
      });
      if (params.dictionarySuggestions.length > 0) menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: `Add "${params.misspelledWord}" to dictionary`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Cut',   role: 'cut'   }));
      menu.append(new MenuItem({ label: 'Copy',  role: 'copy'  }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
    } else if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
    }
    if (menu.items.length > 0) menu.popup();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('window:close',    () => win.close());
ipcMain.handle('window:minimize', () => win.minimize());
ipcMain.handle('window:maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.handle('settings:get',    ()     => loadSettings());
ipcMain.handle('settings:save',   (_, d) => { saveSettings(d); return true; });

ipcMain.handle('fs:readDir',  (_, p)    => { try { if (!fs.existsSync(p)) return []; return fs.readdirSync(p); } catch { return []; } });
ipcMain.handle('fs:readFile', (_, p)    => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } });
ipcMain.handle('fs:writeFile',(_, p, d) => { try { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, d, 'utf8'); return true; } catch { return false; } });
ipcMain.handle('fs:exists',   (_, p)    => fs.existsSync(p));
ipcMain.handle('fs:mkdir',    (_, p)    => { try { fs.mkdirSync(p, { recursive: true }); return true; } catch { return false; } });
ipcMain.handle('fs:rename',   (_, o, n) => { try { fs.renameSync(o, n); return true; } catch { return false; } });
ipcMain.handle('fs:copyDir',  (_, src, dest) => {
  try {
    function copyRecursive(s, d) {
      fs.mkdirSync(d, { recursive: true });
      for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
        const sp = path.join(s, entry.name), dp = path.join(d, entry.name);
        if (entry.isDirectory()) copyRecursive(sp, dp);
        else fs.copyFileSync(sp, dp);
      }
    }
    copyRecursive(src, dest);
    return true;
  } catch { return false; }
});

ipcMain.handle('fs:deleteFile', async (_, p) => {
  try {
    const trash = await getTrash();
    await trash(p);
    return true;
  } catch (e) {
    console.error('[trash] error:', e.message);
    try { fs.rmSync(p, { recursive: true, force: true }); return true; } catch { return false; }
  }
});

ipcMain.handle('path:notesDir',       ()            => { const s = loadSettings(); return s.notesDir || path.join(app.getPath('documents'), 'NotesApp'); });
ipcMain.handle('path:join',           (_, ...parts) => path.join(...parts));
ipcMain.handle('dialog:chooseFolder', async ()      => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('dialog:openFile', async (_, f) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: f || [{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('fs:readFileBase64', (_, p) => { try { return require('fs').readFileSync(p).toString('base64'); } catch { return null; } });
ipcMain.handle('shell:openExternal', (_, url) => shell.openExternal(url));

// ── Convert handlers ──────────────────────────────────────────────────────
ipcMain.handle('fs:writeFileBinary', (_, p, data) => {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, Buffer.from(data, 'binary'));
    return true;
  } catch { return false; }
});
ipcMain.handle('dialog:openFileForConvert', async (_, filters) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_, { defaultName, filters }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle('convert:imgToPdf', async (_, imagePath) => {
  try {
    const fs2   = require('fs');
    const path2 = require('path');
    const data  = fs2.readFileSync(imagePath);
    const b64   = data.toString('base64');
    const ext   = path2.extname(imagePath).toLowerCase().replace('.','');
    return { ok: true, base64: b64, ext };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('convert:pdfToWord', async (_, pdfPath) => {
  // Try pandoc first, then libreoffice
  const { execFile } = require('child_process');
  const path2 = require('path');
  const outPath = pdfPath.replace(/\.pdf$/i, '.docx');
  return new Promise(resolve => {
    execFile('pandoc', [pdfPath, '-o', outPath], err => {
      if (!err) return resolve({ ok: true, outPath });
      execFile('libreoffice', ['--headless','--convert-to','docx','--outdir', path2.dirname(pdfPath), pdfPath], err2 => {
        if (!err2) return resolve({ ok: true, outPath });
        resolve({ ok: false, error: 'pandoc or LibreOffice not found. Please install pandoc.' });
      });
    });
  });
});

ipcMain.handle('convert:wordToPdf', async (_, wordPath) => {
  const { execFile } = require('child_process');
  const path2 = require('path');
  const outDir = path2.dirname(wordPath);
  return new Promise(resolve => {
    execFile('libreoffice', ['--headless','--convert-to','pdf','--outdir', outDir, wordPath], err => {
      if (!err) {
        const outPath = wordPath.replace(/\.(docx?|odt)$/i, '.pdf');
        return resolve({ ok: true, outPath });
      }
      execFile('soffice', ['--headless','--convert-to','pdf','--outdir', outDir, wordPath], err2 => {
        if (!err2) return resolve({ ok: true, outPath: wordPath.replace(/\.(docx?|odt)$/i, '.pdf') });
        resolve({ ok: false, error: 'LibreOffice not found. Please install LibreOffice.' });
      });
    });
  });
});

ipcMain.handle('convert:compressPdf', async (_, pdfPath) => {
  const { execFile } = require('child_process');
  const path2 = require('path');
  const outPath = pdfPath.replace(/\.pdf$/i, '_compressed.pdf');
  return new Promise(resolve => {
    execFile('gs', [
      '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOutputFile=${outPath}`, pdfPath
    ], err => {
      if (!err) return resolve({ ok: true, outPath });
      resolve({ ok: false, error: 'Ghostscript not found. Please install Ghostscript.' });
    });
  });
});

ipcMain.handle('convert:pdfToImg', async (_, pdfPath) => {
  const { execFile } = require('child_process');
  const path2 = require('path');
  const outDir  = path2.dirname(pdfPath);
  const outBase = path2.basename(pdfPath, '.pdf');
  return new Promise(resolve => {
    execFile('pdftoppm', ['-png', '-r', '150', pdfPath, path2.join(outDir, outBase)], err => {
      if (!err) return resolve({ ok: true, outDir, outBase });
      execFile('gs', [
        '-sDEVICE=png16m', '-dNOPAUSE', '-dBATCH', '-r150',
        `-sOutputFile=${path2.join(outDir, outBase + '-%03d.png')}`, pdfPath
      ], err2 => {
        if (!err2) return resolve({ ok: true, outDir, outBase });
        resolve({ ok: false, error: 'pdftoppm or Ghostscript not found.' });
      });
    });
  });
});
ipcMain.handle('spellcheck:setLanguage', (_, lang) => {
  if (win && lang) win.webContents.session.setSpellCheckerLanguages([lang]);
  return true;
});
