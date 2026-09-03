import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { decompress } from 'fzstd';
import * as XLSX from 'xlsx';
import { Card, Deck } from '../types';
import { saveMediaBatch } from './mediaStore';

export interface ParsedDeckResult {
  deckTitle: string;
  folder?: string;
  description?: string;
  cards: Omit<Card, 'id' | 'deckId'>[];
  totalCards: number;
}

// Browser-compatible way to load sql-wasm.wasm
const initSql = async () => {
  return await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });
};

// Clean HTML tags and Anki Cloze syntax from fields
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/\{\{c\d+::([^:}]+)(?:::.*?)?\}\}/g, '$1') // Clean cloze deletions {{c1::word}} -> word
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/\[sound:[^\]]+\]/gi, '') // Remove [sound:xxx.mp3]
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/→/g, '')
    .trim();
}

const extractImage = (html: string) => {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  // Sometimes the field contains just the filename e.g. "image.jpg"
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(html.trim())) {
    return html.trim();
  }
  return undefined;
};

/**
 * Universal media map parser for Anki .apkg (Legacy JSON & Anki 2.1.50+ Zstd Protobuf)
 */
const parseAnkiMediaMap = (mediaBuf: Uint8Array): Record<string, string> => {
  // If zstd compressed, decompress
  if (mediaBuf.length > 4 && mediaBuf[0] === 0x28 && mediaBuf[1] === 0xb5 && mediaBuf[2] === 0x2f && mediaBuf[3] === 0xfd) {
    try {
      mediaBuf = decompress(mediaBuf);
    } catch (e) {
      console.warn('Failed to decompress media buffer with zstd', e);
    }
  }

  // 1. Try JSON (legacy format)
  try {
    const text = new TextDecoder().decode(mediaBuf);
    if (text.trim().startsWith('{')) {
      return JSON.parse(text);
    }
  } catch {}

  // 2. Protobuf decode (Anki 2.1.50+)
  const mediaMap: Record<string, string> = {};
  let offset = 0;
  let index = 0;

  try {
    while (offset < mediaBuf.length) {
      const tag = mediaBuf[offset++];
      if (tag === 0x0a) {
        let len = 0;
        let shift = 0;
        while (true) {
          const b = mediaBuf[offset++];
          len |= (b & 0x7f) << shift;
          if ((b & 0x80) === 0) break;
          shift += 7;
        }

        const end = offset + len;
        let filename = '';

        while (offset < end) {
          const subTag = mediaBuf[offset++];
          if (subTag === 0x0a) {
            let strLen = 0;
            let strShift = 0;
            while (true) {
              const b = mediaBuf[offset++];
              strLen |= (b & 0x7f) << strShift;
              if ((b & 0x80) === 0) break;
              strShift += 7;
            }
            filename = new TextDecoder().decode(mediaBuf.slice(offset, offset + strLen));
            offset += strLen;
          } else {
            const wireType = subTag & 0x07;
            if (wireType === 0) {
              while (mediaBuf[offset++] & 0x80) {}
            } else if (wireType === 2) {
              let subLen = 0;
              let subShift = 0;
              while (true) {
                const b = mediaBuf[offset++];
                subLen |= (b & 0x7f) << subShift;
                if ((b & 0x80) === 0) break;
                subShift += 7;
              }
              offset += subLen;
            } else {
              break;
            }
          }
        }
        if (filename) {
          mediaMap[String(index)] = filename;
          index++;
        }
        offset = end;
      } else {
        break;
      }
    }
  } catch (e) {
    console.warn('Protobuf media parse completed with partial error:', e);
  }

  return mediaMap;
};

/**
 * Import Excel (.xlsx, .xls) files
 * Reads sheets, extracts cell values, hyperlinks, and formulas, and converts them to ParsedDeckResult
 */
export async function parseExcelFile(file: File): Promise<ParsedDeckResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true, cellHTML: true });
  const results: ParsedDeckResult[] = [];
  const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '');

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) continue;

    // Scan all cells for hyperlinks (cell.l.Target) or formulas (=HYPERLINK, =IMAGE)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
          // If cell has a hyperlink target (e.g. pasted or inserted link in Excel)
          if (cell.l && cell.l.Target && cell.l.Target.startsWith('http')) {
            cell.v = cell.l.Target;
            cell.w = cell.l.Target;
          } else if (cell.f && (cell.f.includes('http://') || cell.f.includes('https://'))) {
            // Formula like =HYPERLINK("https://...", ...) or =IMAGE("https://...")
            const match = cell.f.match(/(https?:\/\/[^\s"'>)]+)/i);
            if (match) {
              cell.v = match[1];
              cell.w = match[1];
            }
          }
        }
      }
    }

    // Convert to TSV string
    const tsvData = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
    if (!tsvData || !tsvData.trim()) continue;

    try {
      const sheetTitle = workbook.SheetNames.length > 1 ? `${fileNameNoExt} - ${sheetName}` : fileNameNoExt;
      const parsed = await parseTextOrCsv(tsvData, sheetTitle);
      if (parsed && parsed.cards.length > 0) {
        results.push(parsed);
      }
    } catch (e) {
      console.warn(`Could not parse sheet ${sheetName}:`, e);
    }
  }

  if (results.length === 0) {
    throw new Error('File Excel không có dữ liệu hoặc không nhận diện được các cột từ vựng (cần cột Word/Meaning)!');
  }

  return results;
}

/**
 * Main importer for .apkg, .xlsx/.xls, and .csv/.txt files
 */
export const parseDeckFile = async (file: File): Promise<ParsedDeckResult[]> => {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'apkg') {
    return parseAnkiApkg(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(file);
  } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const text = await file.text();
    return [await parseTextOrCsv(text, file.name)];
  } else if (ext === 'json') {
    const text = await file.text();
    return [parseJsonDeck(text, file.name)];
  } else {
    throw new Error('Định dạng không được hỗ trợ! Vui lòng chọn file .xlsx, .xls, .apkg, .csv, .tsv, .txt, hoặc .json');
  }
};

export async function parseAnkiApkg(file: File): Promise<ParsedDeckResult[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Parse media
  const mediaFile = contents.file('media');
  if (mediaFile) {
    try {
      const mediaBuf = await mediaFile.async('uint8array');
      const mediaMap = parseAnkiMediaMap(mediaBuf);
      const batch: { filename: string; blob: Blob }[] = [];
      
      for (const [key, filename] of Object.entries(mediaMap)) {
        const fileObj = contents.file(key);
        if (fileObj) {
          let fileBuf = await fileObj.async('uint8array');
          // If media file is zstd compressed, decompress it
          if (fileBuf.length > 4 && fileBuf[0] === 0x28 && fileBuf[1] === 0xb5 && fileBuf[2] === 0x2f && fileBuf[3] === 0xfd) {
            try {
              fileBuf = decompress(fileBuf);
            } catch (err) {
              console.warn(`Failed to decompress media ${filename}:`, err);
            }
          }
          const ext = filename.split('.').pop()?.toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
          const blob = new Blob([fileBuf as unknown as BlobPart], { type: mime });
          batch.push({ filename, blob });
        }
      }
      if (batch.length > 0) {
        await saveMediaBatch(batch);
      }
    } catch (e) {
      console.warn('Failed to parse or save media files', e);
    }
  }

  // Find SQLite db
  const anki2File = contents.file('collection.anki21b') || contents.file('collection.anki21') || contents.file('collection.anki2');
  if (!anki2File) {
    throw new Error('Could not find collection.anki2 database inside .apkg');
  }

  let dbBuffer = await anki2File.async('uint8array');

  if (dbBuffer.length > 4 && dbBuffer[0] === 0x28 && dbBuffer[1] === 0xb5 && dbBuffer[2] === 0x2f && dbBuffer[3] === 0xfd) {
    try {
      dbBuffer = decompress(dbBuffer);
    } catch (e) {
      console.warn('Failed to decompress zstd anki database:', e);
    }
  }

  const SQL = await initSql();
  const db = new SQL.Database(dbBuffer);
  
  let deckMap: Record<string, string> = {};
  let modelMap: Record<string, string[]> = {};

  // 1. Parse Deck Names
  try {
    const decksRes = db.exec('SELECT id, name FROM decks');
    if (decksRes.length > 0) {
      decksRes[0].values.forEach(row => {
        deckMap[String(row[0])] = String(row[1]);
      });
    }
  } catch {
    try {
      const colRes = db.exec('SELECT decks FROM col LIMIT 1');
      if (colRes.length > 0 && colRes[0].values.length > 0) {
        const decksJson = JSON.parse(colRes[0].values[0][0] as string);
        for (const key in decksJson) {
          if (decksJson.hasOwnProperty(key)) {
            deckMap[key] = decksJson[key].name;
          }
        }
      }
    } catch (err) {
      console.warn('Could not parse decks JSON from col', err);
    }
  }

  // 2. Parse Notetypes and Field names (Anki 2.1.28+ fields table or col.models)
  try {
    const fieldsRes = db.exec('SELECT ntid, ord, name FROM fields ORDER BY ord');
    if (fieldsRes.length > 0) {
      fieldsRes[0].values.forEach(row => {
        const ntid = String(row[0]);
        const ord = Number(row[1]);
        const name = String(row[2]).toLowerCase();
        if (!modelMap[ntid]) modelMap[ntid] = [];
        modelMap[ntid][ord] = name;
      });
    }
  } catch {
    try {
      const colRes = db.exec('SELECT models FROM col LIMIT 1');
      if (colRes.length > 0 && colRes[0].values.length > 0) {
        const modelsJson = JSON.parse(colRes[0].values[0][0] as string);
        for (const key in modelsJson) {
          if (modelsJson.hasOwnProperty(key)) {
            modelMap[key] = modelsJson[key].flds.map((f: any) => f.name.toLowerCase());
          }
        }
      }
    } catch (err) {
      console.warn('Could not parse models JSON from col', err);
    }
  }

  // 3. Query all notes and cards
  const notesQuery = `
    SELECT c.did, n.mid, n.flds, n.tags, n.id 
    FROM notes n 
    JOIN cards c ON c.nid = n.id 
    ORDER BY c.did, n.id
  `;

  const notesRes = db.exec(notesQuery);
  if (notesRes.length === 0 || notesRes[0].values.length === 0) {
    throw new Error('File Anki không có thẻ học nào!');
  }

  const notesValues = notesRes[0].values;
  const groupedDecks: Record<string, Omit<Card, 'id' | 'deckId'>[]> = {};

  for (const row of notesValues) {
    const did = String(row[0]);
    const mid = String(row[1]);
    const rawFlds = (row[2] as string) || '';
    const rawTags = (row[3] as string) || '';
    
    // Extract image
    const image = extractImage(rawFlds);

    const rawFields = rawFlds.split('\x1f');
    const fields = rawFields.map(cleanHtml);
    const fieldNames = modelMap[mid] || [];

    let front = '';
    let back = '';
    let phonetic = '';
    let example = '';

    // Smart mapping based on field names if available
    if (fieldNames.length > 0 && fields.length <= fieldNames.length) {
      const mapField = (keywords: string[]) => {
        const idx = fieldNames.findIndex((name) => keywords.some((kw) => name.toLowerCase().includes(kw.toLowerCase())));
        if (idx !== -1 && fields[idx]) {
          const val = fields[idx];
          fields[idx] = ''; // mark as used
          return val;
        }
        return '';
      };

      front = mapField(['keyword', 'word', 'front', 'term', 'english', 'từ vựng', 'vocab', 'tiếng anh']);
      back = mapField(['short vietnamese', 'meaning', 'definition', 'translation', 'nghĩa', 'vietnamese', 'tiếng việt', 'back']);
      phonetic = mapField(['transcription', 'phonetic', 'ipa', 'pron', 'phiên âm', 'âm']);
      example = mapField(['explanation', 'example', 'sentence', 'ví dụ', 'câu']);
    }

    // Heuristics fallback
    const remainingFields = fields.filter((f) => f.trim().length > 0);

    const hasUnderscores = (f: string) => (f.match(/_/g) || []).length >= 2;
    const isVietnamese = (f: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúúụủũưừứựửữỳýỵỷỹđ]/i.test(f);

    if (!front && remainingFields.length > 0) {
      // Skip number index if present
      if (/^\d+$/.test(remainingFields[0]) && remainingFields.length > 1) {
        remainingFields.shift();
      }
      front = remainingFields.shift() || '';
    }

    // Remove hint/suggestion if present
    const hintIdx = remainingFields.findIndex(hasUnderscores);
    if (hintIdx !== -1) {
      remainingFields.splice(hintIdx, 1);
    }

    if (!back) {
      const meaningIdx = remainingFields.findIndex(isVietnamese);
      if (meaningIdx !== -1) {
        back = remainingFields[meaningIdx];
        remainingFields.splice(meaningIdx, 1);
      } else if (remainingFields.length > 0) {
        back = remainingFields.shift() || '';
      }
    }

    if (!phonetic && remainingFields.length > 0) {
      const maybePhonetic = remainingFields.findIndex((f) => f.includes('/') || f.includes('[') || f.startsWith('\\'));
      if (maybePhonetic !== -1) {
        phonetic = remainingFields[maybePhonetic];
        remainingFields.splice(maybePhonetic, 1);
      }
    }

    if (!example && remainingFields.length > 0) {
      example = remainingFields.shift() || '';
    }

    if (!front) front = 'Empty Card';
    if (!back) back = front;

    const tags = rawTags.trim() ? rawTags.split(/\s+/).filter(Boolean) : undefined;

    if (!groupedDecks[did]) {
      groupedDecks[did] = [];
    }

    groupedDecks[did].push({
      front,
      back,
      phonetic,
      example,
      image,
      tags,
      level: 0,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReview: Date.now(),
      createdAt: Date.now(),
    });
  }

  const fileNameNoExt = file.name.replace(/\.apkg$/i, '');
  const parsedDecks: ParsedDeckResult[] = [];
  let fallbackCounter = 0;

  for (const [did, cards] of Object.entries(groupedDecks)) {
    let rawTitle = deckMap[did];
    if (!rawTitle) {
      fallbackCounter++;
      rawTitle = Object.keys(groupedDecks).length > 1 
        ? `${fileNameNoExt} - Phần ${fallbackCounter}` 
        : fileNameNoExt;
    }

    if (rawTitle.toLowerCase() === 'default' && Object.keys(groupedDecks).length === 1) {
      rawTitle = fileNameNoExt;
    }

    let folder: string | undefined;
    let deckTitle = rawTitle;

    // Handle hierarchy like "Folder::Subdeck"
    const parts = rawTitle.split('::');
    if (parts.length > 1) {
      folder = parts[0].trim();
      deckTitle = parts.slice(1).join(' - ').trim();
    } else {
      const dashParts = rawTitle.split(' - ');
      if (dashParts.length > 1) {
        folder = dashParts[0].trim();
        deckTitle = dashParts.slice(1).join(' - ').trim();
      }
    }

    parsedDecks.push({
      deckTitle,
      folder,
      description: `Bộ thẻ nhập từ Anki (${cards.length} từ)`,
      cards,
      totalCards: cards.length,
    });
  }

  return parsedDecks.sort((a, b) => a.deckTitle.localeCompare(b.deckTitle));
}

export function extractImageUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let str = raw.trim();
  if (!str) return undefined;
  str = str.replace(/^["']|["']$/g, '').trim();

  // HTML <img src="...">
  const imgMatch = str.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) str = imgMatch[1].trim();

  // Markdown ![...](url)
  const mdMatch = str.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch) str = mdMatch[1].trim();

  // HTML <a href="url">
  const aMatch = str.match(/<a[^>]+href=["']([^"']+)["']/i);
  if (aMatch) str = aMatch[1].trim();

  // Direct http:// or https:// URL anywhere in the cell
  const httpMatch = str.match(/(https?:\/\/[^\s"'>)]+)/i);
  if (httpMatch) str = httpMatch[1].trim();

  // Convert Google Drive share link to direct image link
  const gdriveMatch = str.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) || str.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch) {
    return `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`;
  }

  // Convert Dropbox share link
  if (str.includes('dropbox.com')) {
    return str.replace(/\?dl=0$/, '?raw=1').replace(/&dl=0$/, '&raw=1');
  }

  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:image') || str.startsWith('/')) {
    return str;
  }

  // Local media filename from Anki package
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(str)) {
    return str;
  }

  return undefined;
}

/**
 * Quote-aware CSV / TSV row parser
 * Handles multiline cells inside quotes without breaking lines
 */
function parseRowsRespectingQuotes(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const KNOWN_PARTS_OF_SPEECH = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection',
  'n', 'v', 'adj', 'adv', 'prep', 'conj', 'pron', 'phrase', 'idiom', 'collocation', 'phrasal verb',
  'danh từ', 'động từ', 'tính từ', 'trạng từ', 'phó từ', 'giới từ', 'liên từ', 'thành ngữ', 'cụm từ'
];

/**
 * Import and parse CSV, TSV, TXT or pasted table format
 * Automatically recognizes ANY column arrangement:
 * # | Word | IPA | Type | Meaning | Example | Vietnamese | Image URL | Related words
 */
export async function parseTextOrCsv(content: string, fileName: string): Promise<ParsedDeckResult> {
  if (!content || !content.trim()) {
    throw new Error('Dữ liệu không có nội dung!');
  }

  // Detect delimiter
  const preview = content.slice(0, 3000);
  let delimiter = '\t';
  if (preview.includes('\t')) {
    delimiter = '\t';
  } else if ((preview.match(/;/g) || []).length > (preview.match(/,/g) || []).length) {
    delimiter = ';';
  } else if (preview.includes(',')) {
    delimiter = ',';
  } else if (preview.includes('|')) {
    delimiter = '|';
  }

  // Parse rows with quote support
  const rawRows = parseRowsRespectingQuotes(content, delimiter);
  if (rawRows.length === 0) {
    throw new Error('Không thể đọc dữ liệu từ tệp/bảng dán!');
  }

  // Clean all cells
  const rows = rawRows.map((row) =>
    row.map((cell) =>
      cleanHtml(cell)
        .replace(/^["']|["']$/g, '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
  ).filter((row) => row.some((c) => c.length > 0));

  if (rows.length === 0) {
    throw new Error('Dữ liệu rỗng!');
  }

  // Scan first 5 rows to locate Header row
  let headerRowIndex = -1;
  let colWord = -1;
  let colIPA = -1;
  let colType = -1;
  let colMeaning = -1;
  let colExample = -1;
  let colVietnamese = -1;
  let colImage = -1;
  let colRelated = -1;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const normHeaders = rows[r].map((h) => h.toLowerCase().trim().replace(/^#|\W/g, ''));
    const hasWord = normHeaders.some((h) => ['word', 'front', 'term', 'tu', 'tuvung'].includes(h) || h.includes('word'));
    const hasMeaning = normHeaders.some((h) => ['meaning', 'back', 'nghia', 'dinhnghia', 'vietnamese', 'dich'].includes(h) || h.includes('meaning') || h.includes('nghia'));

    if (hasWord || hasMeaning) {
      headerRowIndex = r;
      normHeaders.forEach((h, idx) => {
        if (['word', 'front', 'term', 'tu', 'tuvung'].includes(h) || h.includes('word') || h.includes('tuvung')) colWord = idx;
        else if (['ipa', 'phonetic', 'phienam', 'pronunciation'].includes(h) || h.includes('ipa') || h.includes('phienam')) colIPA = idx;
        else if (['type', 'pos', 'partofspeech', 'tuloai', 'loaitu'].includes(h) || h.includes('type') || h.includes('tuloai') || h.includes('pos')) colType = idx;
        else if (['meaning', 'back', 'nghia', 'dinhnghia', 'definition'].includes(h) || h.includes('meaning') || h.includes('nghia')) colMeaning = idx;
        else if (['example', 'vividu', 'cauvidu', 'sentence', 'sentences'].includes(h) || h.includes('example') || h.includes('vidu')) colExample = idx;
        else if (['vietnamese', 'nghiavidu', 'dichvidu', 'examplemeaning', 'dich'].includes(h) || h.includes('vietnamese') || h.includes('dich')) colVietnamese = idx;
        else if (['image', 'imageurl', 'img', 'anh', 'linkanh', 'picture', 'photo'].includes(h) || h.includes('image') || h.includes('img') || h.includes('anh') || h.includes('pic') || h.includes('photo')) colImage = idx;
        else if (['related', 'relatedwords', 'tulienquan', 'tudongnghia', 'synonyms', 'collocations'].includes(h) || h.includes('related') || h.includes('lienquan') || h.includes('dongnghia')) colRelated = idx;
      });

      if (colMeaning === -1 && colVietnamese !== -1) {
        colMeaning = colVietnamese;
        colVietnamese = -1;
      }
      break;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
  const cardsList: Omit<Card, 'id' | 'deckId'>[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const parts = rows[i];
    if (parts.length === 0 || !parts.some((p) => p.length > 0)) continue;

    let front = '';
    let back = '';
    let phonetic: string | undefined;
    let partOfSpeech: string | undefined;
    let example: string | undefined;
    let exampleMeaning: string | undefined;
    let image: string | undefined;
    let relatedWords: string | undefined;

    // 1. Initial mapping from Header columns if headers exist
    if (headerRowIndex !== -1) {
      if (colWord !== -1 && parts[colWord]) front = parts[colWord];
      if (colMeaning !== -1 && parts[colMeaning]) back = parts[colMeaning];
      if (colIPA !== -1 && parts[colIPA]) phonetic = parts[colIPA];
      if (colType !== -1 && parts[colType]) partOfSpeech = parts[colType];
      if (colExample !== -1 && parts[colExample]) example = parts[colExample];
      if (colVietnamese !== -1 && parts[colVietnamese]) exampleMeaning = parts[colVietnamese];
      if (colImage !== -1 && parts[colImage]) image = extractImageUrl(parts[colImage]);
      if (colRelated !== -1 && parts[colRelated]) relatedWords = parts[colRelated];
    }

    // 2. Intelligent Fallback / Content-Based Auto-Detection
    // Find image in ANY column if missing
    if (!image) {
      for (const cell of parts) {
        const found = extractImageUrl(cell);
        if (found) {
          image = found;
          break;
        }
      }
    }

    // Find phonetic in ANY column if missing
    if (!phonetic) {
      for (const cell of parts) {
        if (/^\/[^\/]+\/$/.test(cell) || /^\[[^\]]+\]$/.test(cell) || /[əɑɪʊæʌɒʃʒθðŋːˈˌ]/.test(cell)) {
          phonetic = cell;
          break;
        }
      }
    }

    // Find part of speech in ANY column if missing
    if (!partOfSpeech) {
      for (const cell of parts) {
        const clean = cell.toLowerCase().replace(/[().,]/g, '').trim();
        if (KNOWN_PARTS_OF_SPEECH.includes(clean)) {
          partOfSpeech = cell;
          break;
        }
      }
    }

    // If front or back is still missing, detect by content
    if (!front || !back) {
      // Filter out cells already assigned to other fields or pure numbers (#)
      const remainingCells = parts.filter((c) => {
        if (!c || /^\d{1,4}$/.test(c)) return false;
        if (image && c.includes(image)) return false;
        if (phonetic && c === phonetic) return false;
        if (partOfSpeech && c === partOfSpeech) return false;
        return true;
      });

      const isVietnamese = (s: string) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(s);

      // Candidate for front: first English word/phrase (short, <= 50 chars)
      if (!front) {
        const engWordCandidate = remainingCells.find((c) => !isVietnamese(c) && c.length <= 50 && c.split(/\s+/).length <= 4);
        if (engWordCandidate) front = engWordCandidate;
        else if (remainingCells.length > 0) front = remainingCells[0];
      }

      // Candidate for back: Vietnamese definition
      if (!back) {
        const vnMeaningCandidate = remainingCells.find((c) => c !== front && isVietnamese(c) && c.length <= 100);
        if (vnMeaningCandidate) back = vnMeaningCandidate;
        else if (remainingCells.length > 1) back = remainingCells[1];
      }

      // Candidate for example (English sentence)
      if (!example) {
        const exCandidate = remainingCells.find((c) => c !== front && c !== back && !isVietnamese(c) && c.length > 20);
        if (exCandidate) example = exCandidate;
      }

      // Candidate for example meaning (Vietnamese sentence)
      if (!exampleMeaning) {
        const exVnCandidate = remainingCells.find((c) => c !== front && c !== back && isVietnamese(c) && c.length > 25);
        if (exVnCandidate) exampleMeaning = exVnCandidate;
      }

      // Candidate for related words
      if (!relatedWords) {
        const relCandidate = remainingCells.find((c) => c !== front && c !== back && c !== example && c !== exampleMeaning);
        if (relCandidate) relatedWords = relCandidate;
      }
    }

    // Clean star icons commonly found in Excel lists like "classroom ⭐"
    front = front.replace(/[\u2B50\u2605\u2606]/g, '').trim();

    if (front && back) {
      cardsList.push({
        front,
        back,
        phonetic: phonetic && phonetic.trim() ? phonetic : undefined,
        partOfSpeech: partOfSpeech && partOfSpeech.trim() ? partOfSpeech : undefined,
        example: example && example.trim() ? example : undefined,
        exampleMeaning: exampleMeaning && exampleMeaning.trim() ? exampleMeaning : undefined,
        image: extractImageUrl(image),
        relatedWords: relatedWords && relatedWords.trim() ? relatedWords : undefined,
        level: 0,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReview: Date.now(),
        createdAt: Date.now(),
      });
    }
  }

  if (cardsList.length === 0) {
    throw new Error('Không thể nhận diện các cột từ vựng trong file/bảng. Vui lòng kiểm tra lại dữ liệu!');
  }

  const deckTitle = fileName.replace(/\.[^/.]+$/, '');

  return {
    deckTitle: deckTitle || 'Danh Sách Từ Mới',
    description: `Nhập từ ${fileName} (${cardsList.length} từ)`,
    cards: cardsList,
    totalCards: cardsList.length,
  };
}

/**
 * Import JSON Deck
 */
export function parseJsonDeck(content: string, fileName: string): ParsedDeckResult {
  try {
    const data = JSON.parse(content);
    let title = fileName.replace(/\.json$/i, '');
    let cards: Omit<Card, 'id' | 'deckId'>[] = [];

    if (Array.isArray(data)) {
      cards = data.map((item) => ({
        front: item.front || item.word || item.term || '',
        back: item.back || item.meaning || item.definition || '',
        phonetic: item.phonetic || item.ipa,
        example: item.example || item.sentence,
        partOfSpeech: item.partOfSpeech || item.pos || item.type,
        hint: item.hint,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
        level: 0 as const,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReview: Date.now(),
        createdAt: Date.now(),
      })).filter((c) => c.front && c.back);
    } else if (typeof data === 'object' && data !== null) {
      if (data.title) title = data.title;
      const rawCards = Array.isArray(data.cards) ? data.cards : [];
      cards = rawCards.map((item: any) => ({
        front: item.front || item.word || '',
        back: item.back || item.meaning || '',
        phonetic: item.phonetic,
        example: item.example,
        partOfSpeech: item.partOfSpeech,
        hint: item.hint,
        tags: item.tags,
        level: 0 as const,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReview: Date.now(),
        createdAt: Date.now(),
      })).filter((c: any) => c.front && c.back);
    }

    if (cards.length === 0) {
      throw new Error('Dữ liệu JSON không chứa danh sách thẻ hợp lệ (cần các trường front/back hoặc word/meaning).');
    }

    return {
      deckTitle: title,
      description: `Nhập từ JSON (${cards.length} từ)`,
      cards,
      totalCards: cards.length,
    };
  } catch (err: any) {
    throw new Error(err?.message || 'Lỗi khi đọc file JSON');
  }
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Export Deck as JSON or CSV
 */
export function exportDeckAsJson(deck: Deck, cards: Card[]): string {
  const exportData = {
    title: deck.title,
    description: deck.description,
    emoji: deck.emoji,
    cards: cards.map((c) => ({
      front: c.front,
      back: c.back,
      phonetic: c.phonetic,
      example: c.example,
      partOfSpeech: c.partOfSpeech,
      level: c.level,
      tags: c.tags,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

export function exportDeckAsCsv(cards: Card[]): string {
  const header = 'Front,Back,Phonetic,Example,Level\n';
  const rows = cards.map((c) => {
    const f = `"${(c.front || '').replace(/"/g, '""')}"`;
    const b = `"${(c.back || '').replace(/"/g, '""')}"`;
    const p = `"${(c.phonetic || '').replace(/"/g, '""')}"`;
    const e = `"${(c.example || '').replace(/"/g, '""')}"`;
    const l = c.level;
    return `${f},${b},${p},${e},${l}`;
  });
  return header + rows.join('\n');
}
