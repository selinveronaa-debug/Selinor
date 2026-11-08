/**
 * RoomRecall · lib/files.js
 * Reads course files in the browser. PDFs use pdf.js; nothing is uploaded anywhere.
 */

let pdfJsPromise;

/* pdf.js ships with the page (lib/), so PDFs open even when outside scripts are blocked.
   If that copy cannot load, an older build from cdnjs is tried (it also runs without a worker). */
const PDFJS_LOCAL = './lib/pdf.min.mjs', PDFJS_LOCAL_WORKER = './lib/pdf.worker.min.mjs';
const PDFJS_CDNJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script'); el.src = src; el.onload = resolve; el.onerror = () => reject(new Error('script blocked'));
    document.head.appendChild(el);
  });
}
/* The artifact frame can refuse to start a module Web Worker, so pdf.js runs on the main
   thread: importing its worker module and exposing it as globalThis.pdfjsWorker makes
   pdf.js use it in-process. A course PDF still reads in a second or two. */
async function importModule(url) {
  try { return await import(url); }
  catch {
    const code = await (await fetch(url)).text();
    const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try { return await import(blobUrl); } finally { URL.revokeObjectURL(blobUrl); }
  }
}
function getPdfJs() {
  if (!pdfJsPromise) {
    const at = path => new URL(path, document.baseURI).href;
    pdfJsPromise = (async () => {
      const pdfjs = await importModule(at(PDFJS_LOCAL));
      if (!globalThis.pdfjsWorker) globalThis.pdfjsWorker = await importModule(at(PDFJS_LOCAL_WORKER));
      pdfjs.GlobalWorkerOptions.workerSrc = at(PDFJS_LOCAL_WORKER);
      return pdfjs;
    })().catch(() => loadScriptOnce(PDFJS_CDNJS + 'pdf.min.js').then(() => {
      const pdfjs = window.pdfjsLib; if (!pdfjs) throw new Error('pdf.js missing');
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_CDNJS + 'pdf.worker.min.js';
      return pdfjs;
    }));
    pdfJsPromise.catch(() => { pdfJsPromise = null; });
  }
  return pdfJsPromise;
}

/* Second reader: the cdnjs build of pdf.js 3, loaded as plain scripts and run in-process. */
let pdfJsClassicPromise;
function getPdfJsClassic() {
  if (!pdfJsClassicPromise) {
    pdfJsClassicPromise = (async () => {
      if (!window.pdfjsLib) await loadScriptOnce(PDFJS_CDNJS + 'pdf.min.js');
      if (!globalThis.pdfjsWorker?.WorkerMessageHandler) await loadScriptOnce(PDFJS_CDNJS + 'pdf.worker.min.js');
      const pdfjs = window.pdfjsLib; if (!pdfjs) throw new Error('pdf.js 3 missing');
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_CDNJS + 'pdf.worker.min.js';
      return pdfjs;
    })();
    pdfJsClassicPromise.catch(() => { pdfJsClassicPromise = null; });
  }
  return pdfJsClassicPromise;
}

async function textWithPdfJs(pdfjs, bytes) {
  const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false, disableFontFace: true }).promise;
  const pages = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 80); n++) {
    const content = await (await pdf.getPage(n)).getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n');
}

/* Last resort without pdf.js: unpack the PDF's compressed streams and pull out the
   text drawn with Tj / TJ. Works for many PDFs saved from Word, Google Docs or LaTeX. */
async function textByHand(bytes) {
  const raw = new TextDecoder('latin1').decode(bytes);
  const chunks = [];
  const re = /stream\r?\n/g; let m;
  while ((m = re.exec(raw)) && chunks.length < 4000) {
    const start = m.index + m[0].length, end = raw.indexOf('endstream', start);
    if (end < 0) break;
    const dict = raw.slice(Math.max(0, m.index - 300), m.index);
    let data = bytes.subarray(start, end);
    if (/FlateDecode/.test(dict)) {
      try {
        const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'));
        data = new Uint8Array(await new Response(ds).arrayBuffer());
      } catch { re.lastIndex = end; continue; }
    } else if (/\/Filter/.test(dict)) { re.lastIndex = end; continue; }
    chunks.push(new TextDecoder('latin1').decode(data));
    re.lastIndex = end;
  }
  const unescape = t => t.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, c) => ({ n: '\n', r: ' ', t: ' ', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[c] ?? String.fromCharCode(parseInt(c, 8))));
  const lines = [];
  for (const c of chunks) {
    if (!/\bBT\b/.test(c)) continue;
    const parts = [];
    for (const t of c.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj|\[(?:[^\]])*\]\s*TJ/g)) {
      const strs = [...t[0].matchAll(/\((?:\\.|[^\\)])*\)/g)].map(x => unescape(x[0].slice(1, -1)));
      parts.push(strs.join(''));
    }
    if (parts.length) lines.push(parts.join(' '));
  }
  const text = lines.join('\n').replace(/[^\S\n]+/g, ' ');
  const letters = (text.match(/[A-Za-zÆØÅæøåÄÖÜäöüé]/g) || []).length;
  return letters > 200 && letters / Math.max(1, text.length) > .55 ? text : '';
}

async function readPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder('latin1').decode(bytes.subarray(0, 1024)).includes('/Encrypt')) {
    // pdf.js opens most "encrypted" PDFs with an empty password; only a real password stops it.
  }
  const reasons = [];
  for (const [name, get] of [['pdf.js', getPdfJs], ['pdf.js 3', getPdfJsClassic]]) {
    let pdfjs;
    try { pdfjs = await get(); } catch (e) { reasons.push(`${name} did not load`); continue; }
    try {
      const text = await textWithPdfJs(pdfjs, bytes.slice());
      if (text.replace(/\s/g, '').length >= 40) return text;
      reasons.push(`${name} found no text`);
    } catch (e) {
      if (/password/i.test(e?.name || e?.message || '')) throw new Error('it is password protected');
      reasons.push(`${name}: ${String(e?.message || e).slice(0, 60)}`);
    }
  }
  const byHand = await textByHand(bytes).catch(() => '');
  if (byHand) return byHand;
  console.warn('[RoomRecall] PDF reading failed:', reasons);
  if (reasons.every(r => /no text/.test(r))) throw new Error('it has no selectable text (scanned pages?). Take screenshots and drop them on the street instead, or paste the text');
  throw new Error(`the PDF could not be opened (${reasons.join('; ')})`);
}

/* ---------- PowerPoint and Word files are zip archives of XML; read their text directly ---------- */
async function unzipEntries(file, wanted) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('the file looks damaged');
  const count = view.getUint16(eocd + 10, true); let ptr = view.getUint32(eocd + 16, true);
  const dec = new TextDecoder(); const out = [];
  for (let k = 0; k < count; k++) {
    const method = view.getUint16(ptr + 10, true), size = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true), extraLen = view.getUint16(ptr + 30, true), commentLen = view.getUint16(ptr + 32, true);
    const local = view.getUint32(ptr + 42, true);
    const name = dec.decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;
    if (!wanted.test(name)) continue;
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const raw = buf.subarray(start, start + size);
    let bytes = raw;
    if (method === 8) {
      if (!('DecompressionStream' in window)) throw new Error('this browser cannot open it');
      bytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    }
    out.push({ name, text: dec.decode(bytes) });
  }
  return out;
}
const xmlText = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'g'))].map(m => m[1]).join(' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
async function readPptxText(file) {
  const slides = await unzipEntries(file, /^ppt\/(slides\/slide|notesSlides\/notesSlide)\d+\.xml$/);
  slides.sort((a, b) => (+a.name.match(/(\d+)\.xml$/)[1]) - (+b.name.match(/(\d+)\.xml$/)[1]));
  return slides.map(s => xmlText(s.text, 'a:t')).join('\n');
}
async function readDocxText(file) {
  const [doc] = await unzipEntries(file, /^word\/document\.xml$/);
  if (!doc) throw new Error('the file looks damaged');
  return doc.text.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, ' ').match(/<w:t[^>]*>[^<]*<\/w:t>|\n/g)?.map(t => t === '\n' ? '\n' : t.replace(/<[^>]+>/g, '')).join('') || '';
}

/* Read any supported course file as plain text. Throws an Error whose message says why, in plain words. */
/* A file that arrives with no bytes is almost always a cloud placeholder (iCloud,
   OneDrive, Google Drive) that has not been downloaded to the computer yet. */
async function checkNotEmpty(file) {
  let n = file.size;
  if (!n) { try { n = (await file.slice(0, 16).arrayBuffer()).byteLength; } catch { n = 0; } }
  if (!n) throw new Error('the file arrived empty (0 bytes). If it lives in iCloud, OneDrive or Google Drive, download it to your computer first, or drag it in from the Downloads folder');
}

async function readCourseFile(file) {
  await checkNotEmpty(file);
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf' || file.type === 'application/pdf') return readPdfText(file);
  if (ext === 'pptx') return readPptxText(file);
  if (ext === 'docx') return readDocxText(file);
  if (['txt', 'md', 'csv', 'tsv', 'r', 'rtf', 'html', 'htm'].includes(ext) || file.type.startsWith('text/')) return file.text();
  if (['ppt', 'doc', 'key', 'pages', 'numbers', 'xls', 'xlsx'].includes(ext)) throw new Error(`.${ext} files cannot be read here; export it as PDF`);
  throw new Error(`.${ext} is not a course file`);
}
