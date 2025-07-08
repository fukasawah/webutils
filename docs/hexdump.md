# Hex Dump Tool

## 概要
バイナリファイルをhexdump形式で表示し、Canvas上で色分け可視化するWebツールです。

## 機能仕様

### 基本機能
- **ファイル読み込み**: File APIによる任意のバイナリファイル読み込み
- **Hexdump表示**: 従来のhexdumpコマンドと同じ形式で表示
- **Canvas可視化**: バイト値を色分けして1ドット1バイトで描画
- **仮想スクロール**: 大きなファイルの効率的な表示

### Hexdump表示仕様
- **1行**: 16バイト
- **オフセット**: 8桁16進数（例: 00000000:）
- **バイト値**: 16進数2桁（例: 41 42 43）
- **テキスト**: 印刷可能文字のみ（0x20-0x7E）、それ以外は「.」

### Canvas描画仕様
- **サイズ**: 幅256px × 高さ400px
- **1行**: 256バイト
- **色分け**:
  - 0x00 = 白（#FFFFFF）
  - 0x01-0x1F = 水色（#00FFFF）
  - 0x20-0x7E = 赤（#FF0000）
  - 0x80-0xFF = 黒（#000000）

## UI構成

### コントロールパネル
- ファイル選択（input type="file"）
- ファイル情報表示（名前、サイズ）

### 表示エリア
- **左側**: Hexdump出力（スクロール可能）
- **右側**: Canvas描画（固定サイズ）
- **グリッドレイアウト**: 2カラム（デスクトップ）、1カラム（モバイル）

## 技術仕様

### ファイル構成
- **コンポーネント**: `src/components/HexDump.astro`
- **使用場所**: `src/pages/index.astro`

### 主要関数
- `generateHexDump(buffer: ArrayBuffer, offset: number, lines: number): string`
- `drawCanvas(buffer: ArrayBuffer, offset: number): void`
- `handleScroll(event: Event): void`
- `handleFileChange(event: Event): Promise<void>`

### 主要変数
- `BYTES_PER_LINE = 16`: Hexdump表示の1行バイト数
- `CANVAS_BYTES_PER_LINE = 256`: Canvas描画の1行バイト数
- `LINES_TO_DISPLAY = 50`: 表示する行数

### 使用技術
- Astro + TypeScript
- File API
- ArrayBuffer
- Canvas 2D API
- CSS Grid

## パフォーマンス最適化

### 仮想スクロール
- 表示領域に必要な分のみ処理
- スクロール位置に応じた動的読み込み
- メモリ効率的な大きなファイル対応

### スクロール同期
- Hexdump表示とCanvas描画が連動
- スクロール位置の計算と更新
- リアルタイムな表示更新

## ヘルパー関数

### フォーマット関数
- `formatFileSize(bytes: number): string` - ファイルサイズの人間可読形式
- `byteToHex(byte: number): string` - バイト値を16進数文字列に変換
- `byteToChar(byte: number): string` - バイト値を印刷可能文字に変換
- `getByteColor(byte: number): string` - バイト値を色コードに変換

## スタイル仕様

### デザインシステム
- **背景**: 半透明白（backdrop-filter: blur(10px)）
- **フォント**: Inter, Roboto系
- **モノスペース**: ui-monospace, Cascadia Code系

### レスポンシブ対応
- **デスクトップ**: 2カラムレイアウト
- **モバイル（768px以下）**: 1カラム、Canvas優先表示

### スクロールバー
- カスタムスクロールバー（webkit-scrollbar）
- スムーズなスクロール体験

## 使用方法

1. 「Choose File」でバイナリファイルを選択
2. ファイル情報（名前、サイズ）を確認
3. 左側でHexdump表示を確認
4. 右側でCanvas可視化を確認
5. スクロールして任意の位置を表示

## 拡張ポイント

### 追加可能機能
- **検索機能**: バイトパターンやテキスト検索
- **ブックマーク**: 特定位置の保存
- **エクスポート**: 表示範囲のエクスポート
- **比較機能**: 2つのファイルの比較
- **アノテーション**: 特定バイトへのコメント

### パフォーマンス改善
- **Web Workers**: バックグラウンドでの処理
- **キャッシュ**: 読み込み済みデータのキャッシュ
- **プリロード**: 先読み処理

### UI改善
- **ズーム機能**: Canvas表示の拡大縮小
- **カラーテーマ**: 色分けパターンの変更
- **レイアウト**: 表示方法の切り替え

## セキュリティ考慮事項
- ブラウザ内での処理（サーバーアップロードなし）
- ファイル読み込みの制限なし
- メモリ使用量の監視