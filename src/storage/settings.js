export async function getSettings() {
  if (!window.electronAPI) return { setupDone: true };
  return (await window.electronAPI.getSettings()) || {};
}

export async function saveSettings(data) {
  if (!window.electronAPI) return true;
  return window.electronAPI.saveSettings(data);
}
