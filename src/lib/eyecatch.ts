import type { CollectionEntry } from 'astro:content';

type Memo = CollectionEntry<'memo'>;

/**
 * 記事ごとのアイキャッチを、画像ファイルを用意せずに自動生成する。
 *
 * タイトルから決定的に色相を導くので、
 * フロントマターに何も書かなくても記事ごとに違う見た目になる。
 * 同じ記事は何度ビルドしても同じ色になる（ハッシュが決定的なため）。
 */

/** 文字列から安定した整数を得る（djb2 の簡易版） */
function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * 色相環を12分割して割り当てる。
 * 連続した値にせず素数(7)を掛けて飛ばすことで、
 * 似たタイトルが並んでも隣り合う色にならないようにする。
 */
function hueFrom(seed: string): number {
  return ((hashString(seed) % 12) * 7 * 30) % 360;
}

export interface Eyecatch {
  emoji: string;
  hue: number;
  /** カード背景に使うグラデーション */
  gradient: string;
}

export function eyecatch(entry: Memo): Eyecatch {
  const hue = hueFrom(entry.id);
  const emoji = entry.data.emoji ?? '📝';

  // 彩度と明度は固定し、色相だけを振る。
  // こうするとどの記事も同じトーンになり、並べたときに統一感が出る。
  const gradient =
    `linear-gradient(135deg,` +
    ` oklch(0.72 0.13 ${hue}) 0%,` +
    ` oklch(0.62 0.15 ${(hue + 40) % 360}) 100%)`;

  return { emoji, hue, gradient };
}
