import type { CollectionEntry } from 'astro:content';

type Memo = CollectionEntry<'memo'>;

/**
 * ノートのサムネイルを本文から導く。
 *
 * すべて「書類」として描く。コードを含む場合は行を構文色で塗り、
 * 隅に言語バッジを置く。ファイルエクスプローラーのアイコンと同じ発想で、
 * どれも同じ枠に収まり、中身だけが違う状態を作る。
 *
 * 画像を持つノートでその画像をサムネイルにする案は見送っている。
 * 縮小せずに元画像を参照すると、36px の枠のために数百 KB〜数 MB を
 * 落とすことになり、軽さという長所が失われるため。
 * 縮小して使う実装は課題として別に立ててある。
 */

/** 描画する1行。太さと長さで見出し・地の文・コードを表す */
export interface ThumbLine {
  kind: 'heading' | 'text' | 'code';
  /** 0〜1。線の長さの比率 */
  width: number;
}

export interface Thumbnail {
  lines: ThumbLine[];
  /** コードを含む場合の言語（バッジと配色に使う） */
  lang?: LangInfo;
  /** 小さく表示したとき手がかりになるよう、書類に薄く重ねる文字 */
  initial: string;
  hue: number;
}

export interface LangInfo {
  label: string;
  color: string;
  /** バッジの文字色。地の色が明るいときは黒にする */
  ink: string;
}

/**
 * 言語ごとの色。よく使うものだけを持つ。
 * 未知の言語は既定色にして、バッジには言語名をそのまま出す。
 */
const LANGS: Record<string, { label: string; color: string }> = {
  ts: { label: 'TS', color: '#3178c6' },
  typescript: { label: 'TS', color: '#3178c6' },
  tsx: { label: 'TSX', color: '#3178c6' },
  js: { label: 'JS', color: '#e6b800' },
  javascript: { label: 'JS', color: '#e6b800' },
  jsx: { label: 'JSX', color: '#e6b800' },
  astro: { label: 'ASTRO', color: '#ff5d01' },
  python: { label: 'PY', color: '#3776ab' },
  py: { label: 'PY', color: '#3776ab' },
  css: { label: 'CSS', color: '#a855c7' },
  html: { label: 'HTML', color: '#e34c26' },
  json: { label: 'JSON', color: '#6b7280' },
  yaml: { label: 'YAML', color: '#cb4b16' },
  yml: { label: 'YAML', color: '#cb4b16' },
  bash: { label: 'SH', color: '#4eaa25' },
  sh: { label: 'SH', color: '#4eaa25' },
  shell: { label: 'SH', color: '#4eaa25' },
  sql: { label: 'SQL', color: '#e38c00' },
  rust: { label: 'RS', color: '#c88a5a' },
  go: { label: 'GO', color: '#00add8' },
  java: { label: 'JAVA', color: '#b07219' },
  md: { label: 'MD', color: '#6b7280' },
  markdown: { label: 'MD', color: '#6b7280' },
};

const DEFAULT_LANG_COLOR = '#6b7280';

/** 背景色の輝度から、その上に置く文字色を決める */
function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // ITU-R BT.601 の輝度
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 160 ? '#1a1a1a' : '#ffffff';
}

function langInfo(raw: string): LangInfo {
  const key = raw.toLowerCase();
  const found = LANGS[key];
  const label = found?.label ?? raw.slice(0, 4).toUpperCase();
  const color = found?.color ?? DEFAULT_LANG_COLOR;
  return { label, color, ink: inkFor(color) };
}

/** 文字列から安定した整数を得る（djb2 の簡易版） */
function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 色相環を12分割し、素数を掛けて飛ばす。似た id が隣り合う色にならないように */
function hueFrom(seed: string): number {
  return ((hashString(seed) % 12) * 7 * 30) % 360;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Parsed {
  text: ThumbLine[];
  code: ThumbLine[];
  lang?: string;
}

function parseBody(body: string): Parsed {
  const text: ThumbLine[] = [];
  const code: ThumbLine[] = [];
  const langCount: Record<string, number> = {};

  let fence: string | null = null;

  for (const raw of body.replace(/^---[\s\S]*?---/, '').split('\n')) {
    const line = raw.replace(/\r$/, '');
    const fenceMatch = line.match(/^\s*```(\w*)/);

    if (fenceMatch) {
      // 開始なら言語を覚え、終了なら閉じる
      fence = fence === null ? (fenceMatch[1] || 'text') : null;
      continue;
    }

    if (fence !== null) {
      if (line.trim()) {
        langCount[fence] = (langCount[fence] ?? 0) + 1;
        // インデントを長さに反映させると、コードらしい凹凸が出る
        code.push({ kind: 'code', width: clamp(line.length / 46, 0.18, 1) });
      }
      continue;
    }

    if (!line.trim()) continue;
    if (/^\s*\|/.test(line)) continue; // 表は行の見た目が単調なので除く

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      text.push({ kind: 'heading', width: clamp(heading[2].length / 22, 0.35, 0.95) });
      continue;
    }

    const stripped = line.replace(/^\s*[-*+>]\s*/, '');
    text.push({ kind: 'text', width: clamp(stripped.length / 44, 0.3, 1) });
  }

  const lang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  return { text, code, lang: lang && lang !== 'text' ? lang : undefined };
}

/**
 * 書類に薄く重ねる文字。
 * 日付で始まるタイトルだと数字が拾われて意味を持たないので、
 * 文字（漢字・かな・アルファベット）を優先し、無ければ数字にする。
 */
function initialOf(title: string): string {
  return title.match(/\p{L}/u)?.[0] ?? title.match(/\p{N}/u)?.[0] ?? '·';
}

export function thumbnail(entry: Memo, title: string): Thumbnail {
  const hue = hueFrom(entry.id);
  const initial = initialOf(title);
  const { text, code, lang } = parseBody(entry.body ?? '');

  // 地の文を数行見せてからコードを見せると、記事の姿が伝わる。
  // コードが無ければ地の文だけで埋める。
  const lines = code.length
    ? [...text.slice(0, 4), ...code.slice(0, 5)]
    : text.slice(0, 9);

  return {
    lines,
    lang: lang ? langInfo(lang) : undefined,
    initial,
    hue,
  };
}
