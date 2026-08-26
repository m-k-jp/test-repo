// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages（プロジェクトサイト）向けの設定
// 公開URL: https://m-k-jp.github.io/test-repo/
export default defineConfig({
  site: 'https://m-k-jp.github.io',
  base: '/test-repo',
});
