<div align="center">
  <h1>♠ SpadeNotes</h1>
  <p><strong>A calm, focused note-taking app for students and researchers.</strong></p>
  <p>Free · Open Source · Local-first · No accounts · No subscriptions</p>

  <br/>

  [![Release](https://img.shields.io/badge/version-v0.1--early--access-orange?style=flat-square)](https://github.com/namik55/SpadeNotes/releases)
  [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey?style=flat-square)](#download)

</div>

---

## What is SpadeNotes?

SpadeNotes is a desktop note-taking app built for students who find tools like Microsoft Word too complex and Notion too distracting. It opens instantly, gets out of your way, and lets you write.

No cloud sync. No account required. Your notes are plain files on your own machine — always accessible, always yours.

Built by a law student doing a Master's in European Law. Born out of frustration with bloated software during seminar and thesis paper season.

---

## Download

| Platform | File | Notes |
|----------|------|-------|
| **Windows 10/11** | [SpadeNotes.exe](https://github.com/namik55/SpadeNotes/releases/download/v0.1/SpadeNotes.exe) | 64-bit installer |
| **macOS** | Coming soon | Intel + Apple Silicon |

> **Windows Defender warning:** Since SpadeNotes is not code-signed yet, Windows may show an "Unknown publisher" warning. Click **More info → Run anyway** to proceed. This is normal for open source apps without a paid certificate.

---

## Features

- **Rich text editor** — Headings, bold, italic, underline, strikethrough, links, checklists, code blocks, images, and citations
- **Notebooks & folders** — Organize notes into nested notebooks with color tags. Drag and drop to rearrange
- **A4 page canvas** — Write on a real A4 page with proper margins. Looks great on screen and prints correctly
- **Calendar** — Built-in calendar with quick notes per date
- **Pinned notes** — Pin important notes or folders for quick access
- **Local-first** — Notes saved as `.lnote` files on your machine. No internet required
- **Dark mode** — Full light/dark theme support
- **Export** — Export notes to PDF, Word (.docx), and Markdown
- **Read mode** — Distraction-free reading view
- **Spell check** — Built-in spell checker with language selection
- **Zoom** — Adjustable zoom level for the editor canvas
- **Page margins** — Customizable page margins (Settings → Editor)
- **Indent control** — Tab/Shift-Tab indent support for body text

---

## Screenshots

<img width="2558" height="1380" alt="main screen 1" src="https://github.com/user-attachments/assets/ad67da19-2a62-4f26-873b-95fd005aa432" />


<img width="1919" height="1020" alt="calendar 2" src="https://github.com/user-attachments/assets/50be261f-00ec-45e8-a507-b25e3e9a7e8c" />

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron](https://electronjs.org) |
| UI framework | [React](https://react.dev) |
| Rich text editor | [Tiptap](https://tiptap.dev) |
| Build tool | [Vite](https://vitejs.dev) |
| Icons | [Lucide](https://lucide.dev) |
| Fonts | Fraunces · Inter · JetBrains Mono |

---

## Run from Source

**Requirements:** [Node.js 18+](https://nodejs.org)

```bash
# Clone the repository
git clone https://github.com/namik55/SpadeNotes.git
cd SpadeNotes

# Install dependencies
npm install

# Start in development mode
npm run dev
```

---

## Build

```bash
# Windows (.exe installer + portable)
npm run dist

# macOS (.dmg — must be run on a Mac)
npm run dist-mac
```

Output files appear in the `release/` folder.

---

## Project Structure

```
SpadeNotes/
├── electron/          # Electron main process
│   ├── main.js        # App entry point, IPC handlers
│   └── preload.js     # Secure bridge between renderer and Node
├── src/
│   ├── components/    # React components (Editor, Sidebar, Calendar...)
│   ├── storage/       # Note file I/O logic
│   ├── App.jsx        # Root component
│   └── theme.css      # Design tokens & global styles
├── assets/            # App icons
├── docs/              # GitHub Pages website
└── package.json
```

---

## Contributing

SpadeNotes is open source and welcomes contributions. If you find a bug or have a feature idea, open an issue.

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push: `git push origin my-feature`
5. Open a Pull Request

---

## Support

SpadeNotes is free and will always be free. If it saves you time during exam season, consider buying me a coffee ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com)

---

## License

MIT © 2026 Namik

---

<div align="center">
  <sub>Made with frustration and coffee during Law exams.</sub>
</div>
