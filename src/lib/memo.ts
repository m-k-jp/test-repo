import type { CollectionEntry } from 'astro:content';

type Memo = CollectionEntry<'memo'>;

/** ファイル名の先頭にある YYYY-MM-DD を日付として拾う */
function dateFromId(id: string): Date | undefined {
  const m = id.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** 本文の最初の見出し（# ...）を拾う */
function headingFromBody(body: string | undefined): string | undefined {
  const m = body?.match(/^\s*#\s+(.+?)\s*$/m);
  return m?.[1];
}

/**
 * 表示用のタイトル。
 * フロントマター → 本文の最初の見出し → ファイル名 の順に採用する。
 */
export function memoTitle(entry: Memo): string {
  return entry.data.title ?? headingFromBody(entry.body) ?? entry.id;
}

/** 表示用の日付。フロントマター → ファイル名の順。無ければ undefined。 */
export function memoDate(entry: Memo): Date | undefined {
  return entry.data.date ?? dateFromId(entry.id);
}

export function formatDate(d: Date | undefined): string {
  if (!d) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 本文から見出しと記号を落とした抜粋 */
export function memoExcerpt(entry: Memo, max = 80): string {
  const text = (entry.body ?? '')
    .replace(/^---[\s\S]*?---/, '')
    .split('\n')
    .filter((l) => !/^\s*#/.test(l))
    .map((l) => l.replace(/^\s*[-*+]\s+/, '').trim())
    .filter(Boolean)
    .join(' ');
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** 日付の新しい順。日付が無いものは後ろ。下書きは除外。 */
export function sortMemos(entries: Memo[]): Memo[] {
  return entries
    .filter((e) => !e.data.draft)
    .sort((a, b) => (memoDate(b)?.getTime() ?? 0) - (memoDate(a)?.getTime() ?? 0));
}
