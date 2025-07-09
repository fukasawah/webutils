// HexDump Search Worker
// HexDump.astroコンポーネント専用の検索処理Worker
// 
// キャンセル処理について：
// - ファイル読み込み処理の間は制御が戻るためキャンセル可能
// - チャンク単位（1MB）でキャンセルチェックを行うため、十分な応答性を確保
// - ワーカー内でFile.slice()とFileReader APIを使用してファイル読み込みを完結

// Boyer-Moore-Horspool高速検索アルゴリズム
function searchInBuffer(buffer, pattern, startPos = 0) {
    if (pattern.length === 0 || pattern.length > buffer.length) {
        return -1;
    }

    // パターンが短い場合はBrute Force（オーバーヘッドを避ける）
    if (pattern.length <= 2) {
        for (let i = startPos; i <= buffer.length - pattern.length; i++) {
            let found = true;
            for (let j = 0; j < pattern.length; j++) {
                if (buffer[i + j] !== pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        return -1;
    }

    // Boyer-Moore-Horspoolのbad character tableを作成
    const badCharTable = new Array(256).fill(pattern.length);
    for (let i = 0; i < pattern.length - 1; i++) {
        badCharTable[pattern[i]] = pattern.length - 1 - i;
    }

    // Boyer-Moore-Horspool検索
    let pos = startPos + pattern.length - 1;
    while (pos < buffer.length) {
        let patternPos = pattern.length - 1;
        let bufferPos = pos;
        
        // 後ろから前に向かって比較
        while (patternPos >= 0 && buffer[bufferPos] === pattern[patternPos]) {
            patternPos--;
            bufferPos--;
        }
        
        if (patternPos < 0) {
            // マッチした
            return bufferPos + 1;
        }
        
        // bad character tableに基づいてスキップ
        pos += badCharTable[buffer[pos]];
    }
    
    return -1;
}

// メインスレッドからのメッセージを処理
self.onmessage = function(event) {
    const { type, data } = event.data;
    
    switch (type) {
        case 'search':
            handleSearchRequest(data);
            break;
        case 'cancel':
            // 検索キャンセル（実装上は次のチャンク処理時に確認）
            self.searchCancelled = true;
            break;
        default:
            console.warn('Unknown message type:', type);
    }
};

async function handleSearchRequest(data) {
    const { file, pattern, startOffset, chunkSize } = data;
    
    // パターンを配列からUint8Arrayに変換
    const patternArray = new Uint8Array(pattern);
    
    // 検索キャンセルフラグをリセット
    self.searchCancelled = false;
    
    const fileSize = file.size;
    const OVERLAP_SIZE = patternArray.length - 1;
    let searchOffset = startOffset;
    let previousChunkEnd = new Uint8Array(0);
    
    // スループット計算用の変数
    const searchStartTime = Date.now();
    let totalBytesProcessed = 0;

    while (searchOffset < fileSize) {
        // 検索キャンセルチェック
        if (self.searchCancelled) {
            self.postMessage({
                type: 'cancelled'
            });
            return;
        }

        const remainingSize = fileSize - searchOffset;
        const currentChunkSize = Math.min(chunkSize, remainingSize);
        
        // ワーカー内でチャンクを読み込み
        const chunkData = await readFileChunk(file, searchOffset, currentChunkSize);
        
        if (!chunkData) {
            break;
        }

        // 前のチャンクの終端と結合（境界検索用）
        const searchBuffer = new Uint8Array(previousChunkEnd.length + chunkData.length);
        searchBuffer.set(previousChunkEnd, 0);
        searchBuffer.set(chunkData, previousChunkEnd.length);

        // バッファ内でパターンを検索
        const foundIndex = searchInBuffer(searchBuffer, patternArray);
        if (foundIndex !== -1) {
            const fileOffset = searchOffset - previousChunkEnd.length + foundIndex;
            self.postMessage({
                type: 'found',
                offset: fileOffset
            });
            return;
        }

        // 進行状況と推定残り時間を計算して報告
        totalBytesProcessed += currentChunkSize;
        const elapsedMs = Date.now() - searchStartTime;
        const throughputBytesPerSec = elapsedMs > 0 ? (totalBytesProcessed / elapsedMs) * 1000 : 0;
        const progress = (searchOffset / fileSize) * 100;
        
        // 推定残り時間を計算
        const remainingBytes = fileSize - searchOffset;
        const estimatedRemainingMs = throughputBytesPerSec > 0 ? (remainingBytes / throughputBytesPerSec) * 1000 : 0;
        
        self.postMessage({
            type: 'progress',
            progress: progress,
            currentOffset: searchOffset,
            throughputBytesPerSec: throughputBytesPerSec,
            estimatedRemainingMs: estimatedRemainingMs,
            elapsedMs: elapsedMs
        });

        // 次のチャンクのための準備
        previousChunkEnd = chunkData.slice(Math.max(0, chunkData.length - OVERLAP_SIZE));
        searchOffset += currentChunkSize;
    }

    // 見つからなかった場合
    self.postMessage({
        type: 'not_found'
    });
}

// ワーカー内でファイルチャンクを読み込む関数
function readFileChunk(file, offset, size) {
    return new Promise((resolve) => {
        try {
            // File.slice()でチャンクを作成
            const chunk = file.slice(offset, offset + size);
            
            // FileReaderでArrayBufferとして読み込み
            const reader = new FileReader();
            
            reader.onload = function(event) {
                if (event.target && event.target.result) {
                    const arrayBuffer = event.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    resolve(uint8Array);
                } else {
                    resolve(null);
                }
            };
            
            reader.onerror = function() {
                console.error('FileReader error:', reader.error);
                resolve(null);
            };
            
            reader.readAsArrayBuffer(chunk);
        } catch (error) {
            console.error('Error reading file chunk:', error);
            resolve(null);
        }
    });
}