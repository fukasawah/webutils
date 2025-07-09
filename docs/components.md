# 共通コンポーネント仕様

## 概要
Web Toolboxの共通コンポーネントは、コード重複を減らし、一貫性のあるUI/UXを提供するために設計されています。

## コンポーネント一覧

### 1. ToolContainer.astro
ツールページの共通レイアウトを提供するコンポーネント

**Props:**
- `title: string` - ツールのタイトル
- `description: string` - ツールの説明文
- `icon: string` - ツールのアイコン（絵文字）

**使用例:**
```astro
<ToolContainer
  title="Password Generator"
  description="Generate secure passwords with customizable options"
  icon="🔐"
>
  <PasswordGenerator />
</ToolContainer>
```

**機能:**
- ツールヘッダーの表示（タイトル、説明文、アイコン）
- 統一されたレイアウト構造
- レスポンシブデザイン対応
- フェードインアニメーション

### 2. ToolCard.astro
ホーム画面のツールカードを提供するコンポーネント

**Props:**
- `href: string` - リンク先URL
- `icon: string` - ツールアイコン（絵文字）
- `title: string` - ツール名
- `description: string` - ツールの説明
- `features: string[]` - 機能一覧

**使用例:**
```astro
<ToolCard 
  href="/password-generator"
  icon="🔐"
  title="Password Generator"
  description="Generate secure passwords with customizable options"
  features={['Multiple passwords', 'Cryptographically secure', 'Custom character sets']}
/>
```

**機能:**
- ホバーアニメーション
- 機能タグの表示
- 統一されたカードデザイン
- アクセシビリティ対応

### 3. FileInput.astro
ファイル選択とドラッグ&ドロップ機能を提供するコンポーネント

**Props:**
- `accept?: string` - 許可するファイル形式（デフォルト: "*/*"）
- `id?: string` - 入力要素のID（デフォルト: "file-input"）
- `label?: string` - 表示ラベル（デフォルト: "📁 Choose File"）
- `disabled?: boolean` - 無効化状態（デフォルト: false）

**使用例:**
```astro
<FileInput 
  id="file-input"
  accept="*/*"
  label="📁 Choose Binary File"
/>
```

**機能:**
- カスタムファイル入力スタイル
- ファイル情報の表示（ファイル名、サイズ）
- 状態に応じた視覚的フィードバック
- レスポンシブデザイン

## 共通スタイルシステム

### GlobalStyles.astro
全体で使用される共通スタイルとCSS変数を定義

**主な機能:**
- CSS変数による統一されたカラーパレット
- 共通ボタンスタイル（.btn、.btn-primary、.btn-secondary等）
- 共通入力フィールドスタイル（.input、.checkbox等）
- ツール共通レイアウトスタイル
- ユーティリティクラス

**カラーパレット:**
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #16213e;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --accent-primary: #3b82f6;
  --accent-secondary: #8b5cf6;
  /* 他のカラー定義... */
}
```

## 設計原則

### 1. 再利用性
- プロパティベースの設定
- 汎用的な機能設計
- 最小限の依存関係

### 2. 一貫性
- 統一されたデザイン言語
- 共通のアニメーション
- 予測可能な動作

### 3. 保守性
- 明確な責務分離
- 文書化された仕様
- 型安全性の確保

### 4. アクセシビリティ
- セマンティックなHTML
- キーボードナビゲーション
- 適切なコントラスト比

## 新しいツールの追加手順

1. **ページコンポーネントの作成**
   ```astro
   // src/pages/new-tool.astro
   <Layout title="New Tool - Web Toolbox" currentTool="new-tool">
     <ToolContainer
       title="New Tool"
       description="Tool description"
       icon="🔧"
     >
       <NewTool />
     </ToolContainer>
   </Layout>
   ```

2. **SideMenu.astroの更新**
   ```typescript
   const tools = [
     // 既存のツール...
     {
       id: 'new-tool',
       name: 'New Tool',
       icon: '🔧',
       description: 'Tool description',
       href: '/new-tool'
     }
   ];
   ```

3. **index.astroの更新**
   ```typescript
   const tools = [
     // 既存のツール...
     {
       href: '/new-tool',
       icon: '🔧',
       title: 'New Tool',
       description: 'Tool description',
       features: ['Feature 1', 'Feature 2']
     }
   ];
   ```

4. **ドキュメントの作成**
   - `docs/new-tool.md` - ツール仕様書
   - `docs/README.md` - 概要の更新

## ベストプラクティス

### コンポーネント設計
- 単一責任の原則を守る
- プロパティは必要最小限に留める
- デフォルト値を適切に設定する

### スタイリング
- グローバルスタイルを優先的に使用
- CSS変数を活用する
- レスポンシブデザインを考慮する

### TypeScript
- 型定義を明確にする
- プロパティのインターフェースを定義する
- null/undefined チェックを適切に行う

## 今後の拡張予定

### 計画中のコンポーネント
- **SearchInput.astro** - 検索機能付き入力フィールド
- **ResultDisplay.astro** - 結果表示共通コンポーネント
- **StatusBar.astro** - ステータス表示バー
- **Modal.astro** - モーダルダイアログ

### 機能拡張
- **テーマ切り替え** - ライト/ダークモード
- **多言語対応** - 国際化対応
- **キーボードショートカット** - アクセシビリティ向上
- **エクスポート機能** - 結果のファイル出力