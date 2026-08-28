# test-repo

Astro 7 で作った静的サイト。`main` に push すると GitHub Actions がビルドして
GitHub Pages（https://m-k-jp.github.io/test-repo/）へ公開する。

## push する前に必ず検査を通すこと

**コードを変更したら、push する前に `npm run verify` を実行し、
通ったものだけを push する。** 自分の判断で「動いたから大丈夫」と済ませない。

```bash
npm run verify      # eslint → astro check（型検査）→ astro build を順に実行
npm run lint        # リントのみ
npm run check       # 型検査のみ
```

理由: Vite は型注釈を構文として除去するだけで**型検査を行わない**。
そのため型エラーがあってもビルドは成功してしまい、
「動くが型が効いていない」状態に気づけない。
実際に過去、`Astro.props` の Props 型宣言漏れでページ全体の型安全性が
失われていたが、ビルドも表示も正常だったため露見しなかった。

関門は3段ある。いずれかに頼り切らず、手元で先に通しておくこと。

| 段 | 仕組み | 迂回 |
|---|---|---|
| 手元 | `npm run verify` を自分で実行 | — |
| push 時 | `.githooks/pre-push` が `npm run verify` を実行 | `--no-verify` |
| CI | ワークフローの Lint / Type check ステップ | 不可 |

リント設定は `eslint.config.js`（フラットコンフィグ）。`eslint-plugin-jsx-a11y` は
ESLint 10 に未対応のため入れていない。したがって **aria 属性や role の妥当性は
自動検査されない**ので、その種のマークアップは自分で確認すること。

`astro check` は zod 由来の hints を出すが、これは Astro 内部が非推奨サブパスを
再エクスポートしているためで、こちらで対処するものではない。errors が 0 なら通過。

## ブラウザでの確認

見た目や動作を変えたときは、ビルドだけで済ませず実際にブラウザで確認する。
Chromium が `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` にあるので、
playwright から `executablePath` で指定して使う（`playwright install` は不要）。

```bash
npm run preview     # http://localhost:4321/test-repo/ で配信
```

グラフや 3D は `client:visible` の遅延読み込みが効いているかも併せて確認する。

## 構成

```
src/
├── components/     アイランド（Preact）と Astro コンポーネント
├── layouts/        全ページ共通のレイアウトと配色定義
├── lib/            補助モジュール
├── pages/          ファイル名がそのまま URL になる
└── content.config.ts   memo/ をコレクションとして読む設定
memo/               Markdown を置くだけで記事として公開される
```

## 注意点

- **配色は3スコープに分けて定義する** — `:root` / `@media (prefers-color-scheme)` /
  `:root[data-theme="dark"]`。メディアクエリ側には `:not([data-theme="light"])` を
  付けて、利用者の明示的な選択が OS 設定に勝つようにする。
- **canvas は CSS 変数が効かない** — グラフの配色は `src/lib/chart-theme.js` が
  JS 側で判定する。`themechange` イベントで再描画される。
- **日本語では改行が半角スペースになる** — Astro 7 の `compressHTML: 'jsx'` の
  影響。段落の途中で改行せず、1行にまとめる。
- **`import.meta.env.BASE_URL` に末尾スラッシュは無い** — `` `${base}/demo/` `` の
  ように自分でスラッシュを補う。
- **メモにフロントマターは必須ではない** — タイトルは本文の最初の見出し、
  日付はファイル名から補完される（`src/lib/memo.ts`）。
- **サムネイルに実画像は使わない** — 本文から組み立てた「書類」の HTML だけを使う
  （`src/lib/thumbnail.ts`）。縮小せずに元画像を参照すると、36px の枠のために
  数百 KB〜数 MB を落とすことになり、軽さという長所が失われる。
  縮小して使う実装は課題として別に立ててあるので、思いつきで戻さないこと。
