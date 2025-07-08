# Web Toolbox Documentation

## 概要
Web Toolboxは、セキュリティやシステム管理に役立つWebベースのツール集です。

## 収録ツール

### 1. Password Generator
セキュアなパスワードを複数同時生成するツール

**主な機能:**
- 1-20個のパスワードを同時生成
- 改行区切りでの表示
- 文字種・長さのカスタマイズ
- Web Crypto APIによる安全な乱数生成

**詳細:** [password-generator.md](./password-generator.md)

### 2. Hex Dump Tool
バイナリファイルをhexdump形式で表示・可視化するツール

**主な機能:**
- 従来のhexdumpコマンドと同じ形式での表示
- Canvas上での色分け可視化
- 仮想スクロール対応
- 大きなファイルの効率的な処理

**詳細:** [hexdump.md](./hexdump.md)

## 開発環境

### 技術スタック
- **フレームワーク**: Astro
- **言語**: TypeScript/JavaScript
- **スタイル**: CSS（Grid/Flexbox）
- **デプロイ**: Netlify対応

### ファイル構成
```
src/
├── components/
│   ├── PasswordGenerator.astro
│   └── HexDump.astro
├── layouts/
│   └── Layout.astro
└── pages/
    └── index.astro
docs/
├── README.md
├── password-generator.md
└── hexdump.md
```

## 開発コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # プレビュー
```

## ツール修正時の指示方法

各ツールを修正する際は、以下のように指示してください：

### パスワード生成ツールの修正
```
「Password Generatorツールを修正してください。
まず docs/password-generator.md を確認して仕様を理解してから作業してください。
[具体的な修正内容]」
```

### Hexdumpツールの修正
```
「Hex Dump Toolを修正してください。
まず docs/hexdump.md を確認して仕様を理解してから作業してください。
[具体的な修正内容]」
```

### 新しいツールの追加
```
「新しいツール[ツール名]を追加してください。
既存ツールの仕様は docs/ フォルダを参照してください。
[具体的な機能要件]」
```

## ドキュメント更新

ツールに変更を加えた場合は、対応するドキュメントも更新してください：

1. **仕様変更**: 該当ツールの.mdファイルを更新
2. **新機能追加**: 機能仕様セクションに追記
3. **UI変更**: UI構成セクションを更新
4. **技術変更**: 技術仕様セクションを更新

## 設計原則

### セキュリティ
- 防御的なセキュリティツールのみ実装
- クライアントサイドでの処理
- サーバーへの機密情報送信なし

### パフォーマンス
- 大きなファイルの効率的な処理
- 仮想スクロール対応
- メモリ使用量の最適化

### ユーザビリティ
- 直感的なUI
- レスポンシブデザイン
- アクセシビリティ対応

### 拡張性
- モジュラー設計
- 新しいツールの追加容易性
- 既存ツールの機能拡張対応

## 今後の拡張予定

### 候補ツール
- **Base64 Encoder/Decoder**
- **URL Encoder/Decoder**
- **Hash Generator** (MD5, SHA-1, SHA-256)
- **JWT Decoder**
- **JSON Formatter**
- **Regular Expression Tester**

### 共通機能
- **ツール間のデータ連携**
- **設定の永続化**
- **テーマ切り替え**
- **エクスポート機能**