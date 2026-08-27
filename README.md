# test-repo

Astro（静的サイトジェネレーター）で作った公開ページのテストリポジトリです。

## 公開URL

https://m-k-jp.github.io/test-repo/

`main` ブランチに push すると GitHub Actions が自動でビルドして GitHub Pages に公開します。

## 初回だけ必要な設定

1. リポジトリを **Public** に変更する（Settings → General → Danger Zone → Change repository visibility）
2. Settings → Pages → **Source** を **GitHub Actions** に変更する

## ローカルでの開発

```bash
npm install     # 依存関係のインストール
npm run dev     # 開発サーバー起動（http://localhost:4321/test-repo/）
npm run check   # 型検査
npm run verify  # 型検査＋ビルド（push 前におすすめ）
npm run build   # 本番ビルド（dist/ に出力）
npm run preview # ビルド結果の確認
```

## 型検査について

Vite は型注釈を除去するだけで検査は行わないため、型エラーがあってもビルドは
成功してしまいます。そこで3段の関門を設けています。

| 段 | 仕組み |
|---|---|
| 手元 | `npm run verify` |
| push 時 | `.githooks/pre-push` が自動で型検査（`--no-verify` で迂回可） |
| CI | ワークフローの Type check ステップ（迂回不可） |

pre-push フックは `npm install` 時に自動で有効化されます（`prepare` スクリプトが
`core.hooksPath` を設定）。手動で有効にする場合は次の1回だけ実行してください。

```bash
git config core.hooksPath .githooks
```

## ディレクトリ構成

```
├── .github/workflows/deploy.yml  GitHub Pages への自動デプロイ
├── astro.config.mjs              サイトURL・ベースパスの設定
├── public/                       そのまま配信される静的ファイル
├── src/
│   ├── layouts/Layout.astro      共通レイアウト
│   └── pages/index.astro         トップページ（ここを編集）
└── memo/                         メモ（サイトには含まれません）
```

ページを増やすときは `src/pages/` に `.astro` ファイルを追加します。
ファイル名がそのまま URL になります（例: `src/pages/about.astro` → `/test-repo/about/`）。
