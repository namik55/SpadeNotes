import React, { useState, useRef, useEffect } from 'react';
import { FilePlus, FolderOpen, Upload, ArrowLeftRight, Calendar } from 'lucide-react';

function DropdownMenu({ items, onClose }) {
  const ref = useRef();
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 0,
      background: 'var(--bg)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-lg)',
      minWidth: 220,
      zIndex: 100,
      overflow: 'hidden',
      padding: '4px 0',
    }}>
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        ) : item.label ? (
          <div key={i} style={{
            padding: '6px 12px 2px', fontSize: 11, fontWeight: 700, color: 'var(--fg)',
          }}>{item.label}</div>
        ) : (
          <button key={i} onClick={() => { item.action?.(); onClose(); }} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '7px 12px',
            border: 'none', background: 'transparent',
            color: 'var(--fg)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--sans)', textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ flex: 1 }}>{item.name}</span>
            {item.meta && <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.meta}</span>}
          </button>
        )
      )}
    </div>
  );
}

const api = window.electronAPI;

// ── Convert helpers ────────────────────────────────────────────────────────
async function convertPdfToWord() {
  const file = await api.openFileForConvert([{ name: 'PDF', extensions: ['pdf'] }]);
  if (!file) return;
  showToast('Converting…');
  const r = await api.convertPdfToWord(file);
  if (r.ok) showToast(`✓ Saved: ${r.outPath}`);
  else      showToast(`✗ ${r.error}`, true);
}

async function convertWordToPdf() {
  const file = await api.openFileForConvert([{ name: 'Word', extensions: ['docx','doc','odt'] }]);
  if (!file) return;
  showToast('Converting…');
  const r = await api.convertWordToPdf(file);
  if (r.ok) showToast(`✓ Saved: ${r.outPath}`);
  else      showToast(`✗ ${r.error}`, true);
}

async function compressPdf() {
  const file = await api.openFileForConvert([{ name: 'PDF', extensions: ['pdf'] }]);
  if (!file) return;
  showToast('Compressing…');
  const r = await api.compressPdf(file);
  if (r.ok) showToast(`✓ Saved: ${r.outPath}`);
  else      showToast(`✗ ${r.error}`, true);
}

async function convertImgToPdf() {
  const file = await api.openFileForConvert([{ name: 'Image', extensions: ['jpg','jpeg','png','webp','gif'] }]);
  if (!file) return;
  showToast('Converting…');
  const r = await api.convertImgToPdf(file);
  if (!r.ok) return showToast(`✗ ${r.error}`, true);
  // Build PDF using canvas in the browser — no library needed
  const img = new Image();
  const mime = r.ext === 'jpg' || r.ext === 'jpeg' ? 'image/jpeg' : `image/${r.ext}`;
  img.src = `data:${mime};base64,${r.base64}`;
  await new Promise(res => { img.onload = res; });
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  // PDF with embedded JPEG via minimal PDF structure
  const pdfBytes = buildMinimalPdf(img.width, img.height, canvas.toDataURL('image/jpeg', 0.92).split(',')[1]);
  const savePath = await api.saveFile({ defaultName: file.replace(/\.[^.]+$/, '.pdf'), filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (!savePath) return;
  // Write as binary via writeFile (needs base64 → binary in main process)
  // Use a data URL approach: write directly via writeFile with a special marker
  const ok = await api.writeFileBinary(savePath, pdfBytes);
  if (ok) showToast(`✓ Saved: ${savePath}`);
  else    showToast('✗ Could not save.', true);
}

async function convertPdfToImg() {
  const file = await api.openFileForConvert([{ name: 'PDF', extensions: ['pdf'] }]);
  if (!file) return;
  showToast('Converting…');
  const r = await api.convertPdfToImg(file);
  if (r.ok) showToast(`✓ Images saved to: ${r.outDir}`);
  else      showToast(`✗ ${r.error}`, true);
}

function buildMinimalPdf(w, h, jpegB64) {
  // Returns a minimal valid PDF string with the JPEG embedded
  const imgData = atob(jpegB64);
  const len = imgData.length;
  const pts_w = Math.round(w * 72 / 96);
  const pts_h = Math.round(h * 72 / 96);
  const stream = imgData;
  const hdr  = `%PDF-1.4\n`;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pts_w} ${pts_h}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`;
  const contStream = `q ${pts_w} 0 0 ${pts_h} 0 0 cm /Im1 Do Q`;
  const obj4 = `4 0 obj\n<< /Length ${contStream.length} >>\nstream\n${contStream}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${len} >>\nstream\n`;
  const obj5end = `\nendstream\nendobj\n`;
  const xrefOffset = hdr.length + obj1.length + obj2.length + obj3.length + obj4.length + obj5.length + len + obj5end.length;
  const xref = `xref\n0 6\n0000000000 65535 f \n${String(hdr.length).padStart(10,'0')} 00000 n \n${String(hdr.length+obj1.length).padStart(10,'0')} 00000 n \n${String(hdr.length+obj1.length+obj2.length).padStart(10,'0')} 00000 n \n${String(hdr.length+obj1.length+obj2.length+obj3.length).padStart(10,'0')} 00000 n \n${String(hdr.length+obj1.length+obj2.length+obj3.length+obj4.length).padStart(10,'0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return hdr + obj1 + obj2 + obj3 + obj4 + obj5 + stream + obj5end + xref + trailer;
}

let _toastTimeout;
function showToast(msg, isError = false) {
  let el = document.getElementById('convert-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'convert-toast';
    Object.assign(el.style, {
      position:'fixed', bottom:'60px', left:'50%', transform:'translateX(-50%)',
      padding:'8px 18px', borderRadius:'6px', fontSize:'13px',
      fontFamily:'var(--sans)', zIndex:9999, pointerEvents:'none',
      transition:'opacity 0.2s', whiteSpace:'nowrap',
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = isError ? '#e85a5a' : 'var(--fg)';
  el.style.color = 'var(--bg)';
  el.style.opacity = '1';
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3500);
}

async function exportAsPDF(title, htmlContent) {
  const printWindow = window.open('', '_blank');
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; font-size: 11pt; line-height: 1.7; color: #0a0a0a; padding: 20mm 25mm; }
    h1 { font-family: 'Fraunces', serif; font-size: 24pt; font-weight: 500; margin-bottom: 4pt; }
    h2 { font-family: 'Fraunces', serif; font-size: 16pt; font-weight: 500; margin: 18pt 0 8pt; }
    h3 { font-family: 'Fraunces', serif; font-size: 13pt; font-weight: 500; margin: 14pt 0 6pt; }
    p { margin-bottom: 8pt; }
    ul, ol { padding-left: 18pt; margin-bottom: 8pt; }
    blockquote { border-left: 2pt solid #0a0a0a; padding-left: 10pt; margin: 12pt 0; font-style: italic; }
    @page { margin: 20mm 25mm; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h1>${title}</h1>
  ${htmlContent}
  </body></html>`;
  printWindow.document.write(fullHtml);
  printWindow.document.close();
  setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 800);
}

function exportAsHTML(title, htmlContent) {
  const full = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    body { font-family: Inter, sans-serif; font-size: 15px; line-height: 1.7; color: #0a0a0a; background: #fafafa; padding: 40px 20px; }
    .page { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e5e5e3; border-radius: 5px; padding: 56px 72px; }
    h1 { font-family: Fraunces, serif; font-size: 36px; font-weight: 500; margin-bottom: 6px; }
    h2 { font-family: Fraunces, serif; font-size: 24px; font-weight: 500; margin: 28px 0 10px; }
    h3 { font-family: Fraunces, serif; font-size: 20px; font-weight: 500; margin: 22px 0 8px; }
    p { margin-bottom: 12px; }
  </style></head><body>
  <div class="page"><h1>${title}</h1>${htmlContent}</div>
  </body></html>`;
  const blob = new Blob([full], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${title}.html`; a.click();
  URL.revokeObjectURL(url);
}

function exportAsWord(title, htmlContent) {
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}{\\f1 Times New Roman;}}\\f0\\fs22
{\\f1\\fs44\\b ${title.replace(/[{}\\]/g, '')}\\b0\\par}\\par
${htmlContent.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '{\\f1\\fs36\\b $1\\b0\\par}')
  .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '{\\f1\\fs28\\b $1\\b0\\par}')
  .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '{\\b $1\\b0}')
  .replace(/<em[^>]*>(.*?)<\/em>/gi, '{\\i $1\\i0}')
  .replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
  .split('\n').filter(l => l.trim()).join('\\par\n')}}`;
  const blob = new Blob([rtf], { type: 'application/rtf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${title}.rtf`; a.click();
  URL.revokeObjectURL(url);
}

export default function ActionBar({
  onNew, onOpen, onCalendar, onReadMode, readMode,
  activeNote, getEditorHTML,
}) {
  const [exportOpen,  setExportOpen]  = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  async function handleExportPDF()  {
    if (!activeNote) return alert('Please open a note first.');
    await exportAsPDF(activeNote.name, getEditorHTML?.() ?? '');
  }
  function handleExportHTML() {
    if (!activeNote) return alert('Please open a note first.');
    exportAsHTML(activeNote.name, getEditorHTML?.() ?? '');
  }
  function handleExportWord() {
    if (!activeNote) return alert('Please open a note first.');
    exportAsWord(activeNote.name, getEditorHTML?.() ?? '');
  }

  const exportItems = [
    { label: 'Export current note' },
    { name: 'Export as PDF',        meta: '.pdf',  action: handleExportPDF  },
    { name: 'Export as HTML',       meta: '.html', action: handleExportHTML },
    { name: 'Export as Word (RTF)', meta: '.rtf',  action: handleExportWord },
  ];

  const convertItems = [
    { label: 'Documents' },
    { name: 'PDF → Word',   meta: '.docx',   action: convertPdfToWord },
    { name: 'Word → PDF',   meta: '.pdf',    action: convertWordToPdf },
    { name: 'Compress PDF', meta: 'smaller', action: compressPdf      },
    'divider',
    { label: 'Images' },
    { name: 'IMG → PDF', meta: '.pdf', action: convertImgToPdf },
    { name: 'PDF → IMG', meta: '.png', action: convertPdfToImg },
  ];

  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 6,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <button className="btn" onClick={onNew} style={{ gap: 5, alignItems: 'center' }}>
        <FilePlus size={14} /> New
      </button>
      <button className="btn" onClick={onOpen} style={{ gap: 5, alignItems: 'center' }}>
        <FolderOpen size={14} /> Open
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

      <div style={{ position: 'relative' }}>
        <button
          className={`btn ghost${exportOpen ? ' active' : ''}`}
          onClick={() => { setExportOpen(o => !o); setConvertOpen(false); }}
          style={{ gap: 5, alignItems: 'center' }}
        >
          <Upload size={13} /> Export
          <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>
        {exportOpen && <DropdownMenu items={exportItems} onClose={() => setExportOpen(false)} />}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          className={`btn ghost${convertOpen ? ' active' : ''}`}
          onClick={() => { setConvertOpen(o => !o); setExportOpen(false); }}
          style={{ gap: 5, alignItems: 'center' }}
        >
          <ArrowLeftRight size={13} /> Convert
          <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>
        {convertOpen && <DropdownMenu items={convertItems} onClose={() => setConvertOpen(false)} />}
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

      <button className="btn ghost" onClick={onCalendar} style={{ gap: 5, alignItems: 'center' }}>
        <Calendar size={13} /> Calendar
      </button>

      <div style={{ flex: 1 }} />

      <button className="btn outline" onClick={onReadMode}>
        {readMode ? 'Edit mode' : 'Read mode'}
      </button>
    </div>
  );
}
