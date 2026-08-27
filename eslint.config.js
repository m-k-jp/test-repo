import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // ブラウザで動くコード（アイランド・.astro の script）
  {
    files: ['src/**/*.{js,jsx,ts,tsx,astro}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // 設定ファイルなど Node 側で動くもの
  {
    files: ['*.config.{js,mjs,ts}', 'src/content.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
