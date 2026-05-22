const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow:    () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),

  readDir:    (path)       => ipcRenderer.invoke('fs:readDir', path),
  readFile:   (path)       => ipcRenderer.invoke('fs:readFile', path),
  writeFile:  (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
  deleteFile: (path)       => ipcRenderer.invoke('fs:deleteFile', path),
  mkdir:      (path)       => ipcRenderer.invoke('fs:mkdir', path),
  exists:     (path)       => ipcRenderer.invoke('fs:exists', path),
  rename:     (o, n)       => ipcRenderer.invoke('fs:rename', o, n),
  copyDir:    (s, d)       => ipcRenderer.invoke('fs:copyDir', s, d),

  getSettings:  ()    => ipcRenderer.invoke('settings:get'),
  saveSettings: (d)   => ipcRenderer.invoke('settings:save', d),

  chooseFolder: ()        => ipcRenderer.invoke('dialog:chooseFolder'),
  openFile:     (filters) => ipcRenderer.invoke('dialog:openFile', filters),

  getNotesDir: ()          => ipcRenderer.invoke('path:notesDir'),
  joinPath:    (...parts)  => ipcRenderer.invoke('path:join', ...parts),

  setSpellCheckLanguage: (lang) => ipcRenderer.invoke('spellcheck:setLanguage', lang),
  readFileBase64: (path) => ipcRenderer.invoke('fs:readFileBase64', path),
  openExternal:   (url)  => ipcRenderer.invoke('shell:openExternal', url),

  writeFileBinary: (path, data) => ipcRenderer.invoke('fs:writeFileBinary', path, data),
  // Convert
  openFileForConvert: (filters)          => ipcRenderer.invoke('dialog:openFileForConvert', filters),
  saveFile:           (opts)             => ipcRenderer.invoke('dialog:saveFile', opts),
  convertImgToPdf:    (imgPath)          => ipcRenderer.invoke('convert:imgToPdf', imgPath),
  convertPdfToWord:   (pdfPath)          => ipcRenderer.invoke('convert:pdfToWord', pdfPath),
  convertWordToPdf:   (wordPath)         => ipcRenderer.invoke('convert:wordToPdf', wordPath),
  compressPdf:        (pdfPath)          => ipcRenderer.invoke('convert:compressPdf', pdfPath),
  convertPdfToImg:    (pdfPath)          => ipcRenderer.invoke('convert:pdfToImg', pdfPath),
});
