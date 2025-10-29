## nextjs-rich-tpl リポジトリ — Copilot / 開発者向けインストラクション

このファイルは GitHub Copilot や新しくプロジェクトに参加する開発者向けに、リポジトリの概要、主要なファイル構成、開発環境、よく使うコマンド、注意点を日本語でまとめたものです。

---

### プロジェクト概要

- 名前: nextjs-rich-tpl
- 目的: Next.js ベースのプロジェクトテンプレート群と、それらを生成する CLI（create-next-rich-tpl / nextjs-rich-tpl）を収めたモノレポです。複数のテンプレート（i18n 対応やルーティング実例など）を管理しています。
- 主な機能: テンプレートの提供、テンプレートのインデックス生成・検証・スモークテスト、CLI によるプロジェクト作成支援。

### 主要なディレクトリ / ファイル（ルート）

- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` — ワークスペース管理と依存定義
- `README.md` — プロジェクト概要（英/和 他に README/ 配下のファイルあり）
- `clean.mjs` — プロジェクトルートのクリーンアップ用スクリプト
- `scripts/` — 開発用ユーティリティや検証スクリプト（例: `generate-index.js`, `smoke-test.js`, `validate-index.mjs`, `cleanMacJunkFiles.mjs`）
- `templates/` — 実際の Next.js テンプレート群（`app/` 以下に複数のテンプレートが入っています）
  - `templates/app/with-i18n-routing/` など、テンプレートごとにサンプルアプリが配置されています。
- `packages/`
  - `create-next-rich-tpl/` — テンプレート生成 CLI のパッケージ
  - `nextjs-rich-tpl/` — 旧来のテンプレート配布パッケージ（非推奨の旨が package に記載されていることがあります）

テンプレート内の注目パス（例）:
- `templates/app/with-i18n-routing/src/i18n/` — 国際化用ユーティリティやルーティング
- `templates/app/*/_translations/` — 翻訳ファイル（en/ja 等）

### 開発環境（推奨・前提）

- OS: Windows / macOS / Linux に対応します（あなたの環境に合わせてください）。このワークスペースは Windows 環境で作業例が確認されています。 
- Node.js: 推奨 Node.js 22+（[Vercel でビルドと関数の Node.js 18 廃止に伴い](https://vercel.com/changelog/node-js-18-is-being-deprecated)） — プロジェクトに合わせて変更可（package.json の engines を確認してください）。
- パッケージマネージャ: pnpm（ワークスペース設定あり）。pnpm がインストールされていること。
- エディタ: VS Code（型定義・TS 設定あり）。

（注）上記は合理的な仮定です。実際の Node バージョンや pnpm バージョンは `package.json` や CI 設定を参照してください。

### よく使うコマンド（PowerShell 用例）

```powershell
# ルートで依存をインストール
pnpm install

# スクリプト実行例: インデックス生成やテスト類
node .\scripts\generate-index.js
node .\scripts\smoke-test.js
node .\scripts\validate-index.mjs
node .\scripts\cleanMacJunkFiles.mjs

# ローカルで create CLI を実行してテンプレートからプロジェクトを作る（手動実行例）
node .\packages\create-next-rich-tpl\bin\create.mjs
```

（PowerShell 以外のシェルを使う場合はパス区切りを適切に変更してください）

### 開発フローと注意点

- このリポジトリは pnpm workspace を利用したモノレポ構成です。ルートで依存をインストールした後、個別パッケージを操作してください。
- テンプレートの変更を行う場合は、templates 以下の各テンプレートフォルダにある README や設定（`tsconfig.json`, `next.config.mjs`, `package.json`）を合わせて更新してください。
- 翻訳（i18n）関連は `_translations` フォルダ構造に従っており、言語ごとに JSON ファイルが配置されています。翻訳追加時は metadata など整合性を保ってください。
- 重要なスクリプトを編集する場合は、まずローカルで `node .\scripts\smoke-test.js` を実行して主要ケースが壊れていないことを確認してください。

### コーディング規約・レビュー

- リポジトリ内に ESLint / TypeScript 設定ファイルが含まれるテンプレートがあります。テンプレート側のルールに従ってください。
- Pull Request は小さく分け、テンプレート変更は既存のテンプレートで手動での検証（動作確認）を行ってから提出してください。

### 貢献方法

1. Fork -> feature ブランチを作成 -> 変更 -> tests／smoke-test を実行
2. Pull Request を作成（変更点と動作確認手順を PR 説明に記載してください）

### 補足（Copilot に期待すること）

- このリポジトリを編集するときは、テンプレートの互換性（Next.js のバージョン、i18n の構成）を崩さないよう提案してください。
- 具体的な変更（ファイル追加/編集）を行う際は、影響範囲（どのテンプレート／パッケージに影響するか）を明記する提案を求めます。

---

このファイルはプロジェクトの導入や Copilot の補助に使うための案内です。必要に応じて更新してください。
