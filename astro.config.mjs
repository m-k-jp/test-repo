// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

// GitHub Pages（プロジェクトサイト）向けの設定
// 公開URL: https://m-k-jp.github.io/test-repo/
export default defineConfig({
  site: 'https://m-k-jp.github.io',
  base: '/test-repo',
  integrations: [preact()],
  markdown: {
    // コードの配色もサイトの配色に追従させる。
    // 2つのテーマを CSS 変数として出力し、切り替えは Layout.astro の CSS が行う。
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});