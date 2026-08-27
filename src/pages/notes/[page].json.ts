import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { sortMemos, memoDate } from '../../lib/memo';
import { renderNoteItem, renderMonthHeading, monthLabel } from '../../lib/note-item';

/**
 * サイドペインの続きを配る JSON。
 *
 * 全件を各ページの HTML に埋めると、出力サイズがノート数の2乗で増える
 * （2000本なら 1ページ 2.3MB × 2000ページ）。
 * そこで最初のひと塊だけを HTML に入れ、残りはここから取りに来る。
 *
 * 中身はビルド時に組み立て済みの HTML 断片。
 * 描画の実装が note-item.ts の1か所で済み、
 * サーバー側とクライアント側で見た目が食い違わない。
 */

/** ひと塊の件数。HTML に埋める最初の塊もこの件数 */
export const CHUNK = 60;

export const getStaticPaths: GetStaticPaths = async () => {
  const memos = sortMemos(await getCollection('memo'));
  const total = Math.max(1, Math.ceil(memos.length / CHUNK));
  return Array.from({ length: total }, (_, i) => ({ params: { page: String(i) } }));
};

export const GET: APIRoute = async ({ params }) => {
  const index = Number(params.page);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const memos = sortMemos(await getCollection('memo'));

  const slice = memos.slice(index * CHUNK, (index + 1) * CHUNK);

  // 直前の塊の末尾と同じ月なら、見出しを重ねて出さない
  const previous = index > 0 ? memos[index * CHUNK - 1] : undefined;
  let currentLabel = previous ? monthLabel(memoDate(previous)) : '';

  let html = '';
  let open = index > 0;
  for (const entry of slice) {
    const label = monthLabel(memoDate(entry));
    if (label !== currentLabel) {
      if (open) html += '</ul>';
      html += renderMonthHeading(label) + '<ul>';
      currentLabel = label;
      open = true;
    }
    html += renderNoteItem(entry, base);
  }
  if (open) html += '</ul>';

  return new Response(
    JSON.stringify({ html, hasNext: (index + 1) * CHUNK < memos.length }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
