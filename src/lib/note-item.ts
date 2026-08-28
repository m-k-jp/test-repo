import type { CollectionEntry } from 'astro:content';
import { thumbnail, type Thumbnail } from './thumbnail';
import { memoTitle } from './memo';

type Memo = CollectionEntry<'memo'>;

/**
 * サイドペインの1項目を HTML 文字列として組み立てる。
 *
 * ビルド時に組んだ HTML を、そのままページにも JSON にも入れる。
 * 描画の実装がここ1か所しかないので、
 * サーバー側とクライアント側で見た目が食い違うことがない。
 *
 * 生成した HTML は Astro のスコープ付きスタイルの対象外になるため、
 * ここで使うクラスの定義は src/styles/notes.css（全体に効く）に置く。
 */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export function renderThumbnail(t: Thumbnail, size: string): string {
  const style = `--thumb-size:${size}`;

  const lines = t.lines
    .map((l) => {
      const color = l.kind === 'code' && t.lang ? `;background:${t.lang.color}` : '';
      return `<span class="ln ln--${l.kind}" style="width:${Math.round(l.width * 100)}%${color}"></span>`;
    })
    .join('');

  const badge = t.lang
    ? `<span class="badge" style="background:${t.lang.color};color:${t.lang.ink}">${escapeHtml(t.lang.label)}</span>`
    : '';

  return (
    `<span class="thumb thumb--doc" style="${style}" aria-hidden="true">` +
    `<span class="ini">${escapeHtml(t.initial)}</span>` +
    `<span class="lines">${lines}</span>${badge}</span>`
  );
}

/** サイドペインの1項目（<li>）。current はサーバー側で分かるときだけ渡す */
export function renderNoteItem(entry: Memo, base: string, current = false): string {
  const title = memoTitle(entry);
  const t = thumbnail(entry, title);
  const href = `${base}/memo/${entry.id}/`;
  const mark = current ? ' aria-current="page"' : '';

  return (
    `<li><a href="${escapeHtml(href)}"${mark}>` +
    renderThumbnail(t, '36px') +
    `<span class="text"><span class="title">${escapeHtml(title)}</span></span>` +
    `</a></li>`
  );
}

/** 年月の見出し。日付が無いものは末尾にまとめる */
export function monthLabel(d: Date | undefined): string {
  return d ? `${d.getFullYear()}年${d.getMonth() + 1}月` : '日付なし';
}

export function renderMonthHeading(label: string): string {
  return `<p class="month">${escapeHtml(label)}</p>`;
}
