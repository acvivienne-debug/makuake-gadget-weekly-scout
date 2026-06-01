# OpenAI Codex for Open Source Application Draft

Official form:

https://openai.com/ja-JP/form/codex-for-oss/

This document prepares copy for the Codex for Open Source application. Fill in
the personal and repository fields before submitting.

## Required Fields

姓:

```text
[あなたの姓]
```

名:

```text
[あなたの名]
```

メールアドレス:

```text
[ChatGPTアカウントに登録しているメールアドレス]
```

GitHub ユーザー名:

```text
[GitHubユーザー名]
```

GitHub リポジトリ URL:

```text
https://github.com/acvivienne-debug/makuake-gadget-weekly-scout
```

役割:

```text
メインメンテナー
```

## このリポジトリが対象となる理由

500文字以内:

```text
このリポジトリは、国内クラウドファンディングの公開前プロジェクト調査を、過剰アクセスを避けながら再現可能にするOSSです。Playwright取得、SQLiteキャッシュ、ジャンルスコアリング、選抜フィードバック学習、ショート台本生成をNext.js/TypeScriptで統合し、個人クリエイターや小規模編集者が毎週のリサーチを安全に自動化できます。外部サイトへの配慮、確認UI、取得制限を実装例として公開する点に価値があります。
```

## 興味のある項目

```text
Codex Security
プロジェクトで使用する API クレジット
```

## OpenAI 組織 ID

```text
[platform.openai.com の Organization ID]
```

## API クレジットの活用予定

500文字以内:

```text
APIクレジットは、選抜理由・ナレーション台本・YouTube Shorts/X投稿文の生成精度向上、利用者が採用/除外した候補からの評価基準抽出、PRレビュー、Issueトリアージ、セキュリティ確認の自動化に使います。まずは生成部分をOpenAI APIに差し替えられるprovider層を追加し、テスト付きでOSSとして公開します。
```

## 他に伝えたいこと

500文字以内:

```text
現時点ではMakuakeへのアクセスをユーザー承認制・1日2回・SQLiteキャッシュ保存に制限しています。応募前にGitHubリポジトリをpublicにし、ライセンス、README、利用上の注意、スクリーンショットを整備します。新規OSSの場合は採用実績が弱いため、公開後の利用者・スター・Issue/PR実績を追記します。
```

## Submission Checklist

- [ ] GitHub repository is public.
- [ ] GitHub profile is public.
- [ ] License is selected and added.
- [ ] README is visible at the repository root.
- [ ] `.codex-app-server/` and local cache files are not committed.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Screenshots or a demo video are added to the repository.
- [ ] GitHub stars, usage numbers, or ecosystem importance are added when available.
