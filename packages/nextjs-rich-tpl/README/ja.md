# Next.js Rich Template / CLI

Next.js Rich Template は、Next.js アプリケーションの迅速なセットアップを支援する CLI ツールです。事前に用意されたテンプレートを使用して、新しいプロジェクトを簡単に作成できます。

## 目次

- [特徴](#特徴)
- [インストール](#インストール)
- [使い方](#使い方)
- [依存関係](#依存関係)
- [ライセンス](#ライセンス)

## 特徴

- 複数の Next.js テンプレートを選択可能
- プロジェクトの初期セットアップを自動化
- 依存関係のインストールをサポート
- 進捗バーでユーザーに進行状況を表示

## 使い方

`nextjs-rich-tpl` を使用して新しいNext.jsアプリを開始することをお勧めします。 プロジェクトを作成するには

```bash
npx nextjs-rich-tpl
```

インストールすると、以下のプロンプトが表示されます：

```bash
Select a Next.js template:
❯ Next.js app with i18n routing setup
  Next.js app without i18n routing setup
Enter your project name: (my-nextjs-app)
```

プロンプトの後、`nextjs-rich-tpl` はプロジェクト名のフォルダを作成し、必要な依存関係をインストールします。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
