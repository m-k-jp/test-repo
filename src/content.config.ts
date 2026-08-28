import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * リポジトリ直下の memo/ をそのままコレクションとして読む。
 * base はプロジェクトルートからの相対パスなので、Markdown を src/ に移す必要はない。
 *
 * フロントマターは「あれば使う」程度の扱いにしてある。
 * 何も書かれていない素の Markdown を置いただけでも公開できるようにするため、
 * すべての項目を optional にし、タイトルと日付は本文とファイル名から補う
 * （補完のロジックは src/lib/memo.ts）。
 */
const memo = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './memo' }),
  schema: z.object({
    title: z.string().optional(),
    // アイキャッチに使う絵文字。未指定なら既定値が入る（src/lib/eyecatch.ts）
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { memo };
