// Unified Hash Calculator Worker
// WASM-first with JS fallback implementation

// WASM imports (hash-wasm)
import {
    createSHA1,
    createSHA256,
    createSHA384,
    createSHA512,
    createMD5,
} from 'hash-wasm';

// JS fallback imports (@noble/hashes)
import { sha1 } from '@noble/hashes/legacy';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

// Message types
const MESSAGE_TYPES = {
    PROGRESS: 'progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ERROR: 'error',
    CALCULATE: 'calculate',
    CANCEL: 'cancel',
    INIT: 'init',
    INITIALIZED: 'initialized',
    START_CALCULATION: 'start_calculation',
    HASH_COMPLETE: 'hash_complete',
    STOP: 'stop',
    RESET: 'reset'
};

// Performance configuration
const PERFORMANCE_CONFIG = {
    CHUNK_SIZE: 8 * 1024 * 1024, // 8MB chunks
    PROGRESS_UPDATE_INTERVAL: 16 * 1024 * 1024, // Update every 16MB
};

// Algorithm configuration
const algorithms = {
    'SHA-1': {
        wasmCreate: createSHA1,
        jsHash: sha1
    },
    'SHA-256': {
        wasmCreate: createSHA256,
        jsHash: sha256
    },
    'SHA-384': {
        wasmCreate: createSHA384,
        jsHash: sha384
    },
    'SHA-512': {
        wasmCreate: createSHA512,
        jsHash: sha512
    },
    'MD5': {
        wasmCreate: createMD5,
        jsHash: null // MD5 not available in @noble/hashes
    }
};

class UnifiedHashWorker {
    constructor() {
        this.useWasm = false;
        this.wasmHashers = new Map(); // Cache WASM hashers
        this.jsHashers = new Map(); // Cache JS hashers
        this.currentHasher = null;
        this.algorithm = '';
        this.isProcessing = false;
        this.isCancelled = false;

        // Progress tracking
        this.fileSize = 0;
        this.totalProcessed = 0;
        this.startTime = 0;
        this.lastProgressTime = 0;
        this.lastProgressBytes = 0;

        console.log('UnifiedHashWorker initialized');
    }

    async initialize(preferWasm = true) {
        console.log('UnifiedHashWorker: Initializing...');

        this.useWasm = preferWasm;

        // List all supported algorithms (lazy initialization)
        const supportedAlgorithms = Object.keys(algorithms);

        console.log(`UnifiedHashWorker: Initialized with ${this.useWasm ? 'WASM-first' : 'JS-only'} mode`);
        console.log('UnifiedHashWorker: Supported algorithms:', supportedAlgorithms);

        self.postMessage({
            type: MESSAGE_TYPES.INITIALIZED,
            supportedAlgorithms: supportedAlgorithms,
            workerType: this.useWasm ? 'wasm' : 'js',
            mode: this.useWasm ? 'WASM-first' : 'JavaScript'
        });
    }

    async getWasmHasher(algorithm) {
        if (this.wasmHashers.has(algorithm)) {
            return this.wasmHashers.get(algorithm);
        }

        const config = algorithms[algorithm];
        if (!config || !config.wasmCreate) {
            return null;
        }

        try {
            console.log(`UnifiedHashWorker: Creating WASM hasher for ${algorithm}...`);
            const hasher = await config.wasmCreate();
            this.wasmHashers.set(algorithm, hasher);
            console.log(`UnifiedHashWorker: ${algorithm} WASM hasher created and cached`);
            return hasher;
        } catch (error) {
            console.warn(`UnifiedHashWorker: Failed to create WASM hasher for ${algorithm}:`, error.message);
            return null;
        }
    }
    async getJsHasher(algorithm) {
        const config = algorithms[algorithm];
        if (!config || !config.jsHash) {
            return null;
        }
        return config.jsHash.create();
    }


    async startCalculation(file, algorithm, useWasm = true, chunkSize = PERFORMANCE_CONFIG.CHUNK_SIZE) {
        let hasher;
        if (useWasm) {
            hasher = await this.getWasmHasher(algorithm);
        } else {
            hasher = await this.getJsHasher(algorithm);
        }

        if (!hasher) {
            throw new Error(`No hasher available for algorithm ${algorithm}`);
        }

        this.currentHasher = hasher;
        this.processedChunk = 0;
        this.totalProcessed = 0;
        this.fileSize = file.size;

        // Initialize the hasher
        if (useWasm) {
            this.currentHasher.init();
        }

        let offset = 0;
        try {
            while (!this.isCancelled && offset < file.size) {
                const chunkData = await this.readFileChunk(file, offset, chunkSize);
                if (!chunkData) {
                    throw new Error('Failed to read file chunk');
                }

                this.currentHasher.update(chunkData);

                this.processedChunk++;
                this.totalProcessed += chunkData.length;
                offset += chunkData.length;

                this.reportProgress();
            }

            if (!this.isCancelled) {
                await this.finalizeHash();
            }

        } catch (error) {
            console.error('UnifiedHashWorker: Error processing chunk:', error);
            self.postMessage({
                type: MESSAGE_TYPES.ERROR,
                message: `Error processing chunk: ${error.message}`
            });
        } finally {
            this.reset();
        }
    }

    async finalizeHash() {
        if (!this.currentHasher) {
            throw new Error('Hasher not initialized');
        }

        try {
            console.log(`UnifiedHashWorker: Finalizing ${this.algorithm} hash`);

            // オプションを変える場合を考慮してここではWASM Hasherのインスタンスがあるかどうか調べる
            const isWasmMode = this.wasmHashers.values().some((v) => v === this.currentHasher);

            let hashHex;
            if (isWasmMode) {
                // hash-wasm
                hashHex = this.currentHasher.digest('hex');
                this.currentHasher.init();
            } else {
                // noble/hashes 
                hashHex = bytesToHex(this.currentHasher.digest());
                this.currentHasher.destroy()
            }

            console.log(`UnifiedHashWorker: Hash completed: ${hashHex.toUpperCase()}`);

            self.postMessage({
                type: MESSAGE_TYPES.HASH_COMPLETE,
                algorithm: this.algorithm,
                hash: hashHex.toUpperCase(),
                fileSize: this.totalProcessed,
                processingTime: Date.now() - this.startTime,
                mode: isWasmMode ? 'WASM' : 'JavaScript'
            });


        } catch (error) {
            console.error('UnifiedHashWorker: Error finalizing hash:', error);
            self.postMessage({
                type: MESSAGE_TYPES.ERROR,
                message: `Error finalizing hash: ${error.message}`
            });
        }
    }

    // For text input (simple case)
    async calculateTextHash(algorithm, text, preferWasm = true) {
        try {
            console.log(`UnifiedHashWorker: Calculating ${algorithm} hash for text`);

            const config = algorithms[algorithm];
            if (!config) {
                throw new Error(`Algorithm ${algorithm} not supported`);
            }

            const textBytes = new TextEncoder().encode(text);
            let hashHex;
            let mode;

            // Try WASM first if available and preferred
            if (preferWasm) {
                const wasmHasher = await this.getWasmHasher(algorithm);
                if (wasmHasher) {
                    try {
                        wasmHasher.init();
                        wasmHasher.update(textBytes);
                        hashHex = wasmHasher.digest('hex');
                        mode = 'WASM';
                        console.log(`UnifiedHashWorker: Text hash calculated using WASM`);
                    } catch (wasmError) {
                        console.warn('UnifiedHashWorker: WASM failed, falling back to JS:', wasmError.message);
                        // Fall through to JS mode
                    }
                }
            }

            // Use JS if WASM failed or not available
            if (!hashHex && config.jsHash) {
                const hashBytes = config.jsHash(textBytes);
                hashHex = bytesToHex(hashBytes);
                mode = 'JavaScript';
                console.log(`UnifiedHashWorker: Text hash calculated using JS`);
            }

            if (!hashHex) {
                throw new Error(`No implementation available for ${algorithm}`);
            }

            self.postMessage({
                type: MESSAGE_TYPES.COMPLETED,
                algorithm: algorithm,
                hash: hashHex.toUpperCase(),
                inputType: 'text',
                inputLength: text.length,
                mode: mode
            });

        } catch (error) {
            console.error('UnifiedHashWorker: Error calculating text hash:', error);
            self.postMessage({
                type: MESSAGE_TYPES.ERROR,
                message: error.message
            });
        }
    }

    reportProgress() {
        const progress = this.fileSize > 0 ? (this.totalProcessed / this.fileSize) * 100 : 0;
        self.postMessage({
            type: MESSAGE_TYPES.PROGRESS,
            progress: progress,
            processed: this.totalProcessed,
            total: this.fileSize,
            processedChunk: this.processedChunk,
        });
    }

    async readFileChunk(file, offset, size) {
        return new Promise((resolve) => {
            try {
                const chunk = file.slice(offset, offset + size);
                const reader = new FileReader();

                reader.onload = function (event) {
                    if (event.target && event.target.result) {
                        resolve(new Uint8Array(event.target.result));
                    } else {
                        resolve(null);
                    }
                };

                reader.onerror = function () {
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

    stop() {
        console.log('UnifiedHashWorker: Stopping...');
        this.isCancelled = true;
        this.isProcessing = false;
    }

    reset() {
        this.currentHasher = null;
        this.isProcessing = false;
        this.isCancelled = false;
        this.totalProcessed = 0;
        this.fileSize = 0;
        this.algorithm = '';
    }
}

// Worker instance
const worker = new UnifiedHashWorker();

// Handle messages from main thread
self.onmessage = async function (event) {
    const { type, data } = event.data;

    console.log('UnifiedHashWorker: Received message:', type);

    try {
        switch (type) {
            case MESSAGE_TYPES.INIT:
                await worker.initialize(data?.preferWasm !== false);
                break;
            case MESSAGE_TYPES.CALCULATE:
                // For text input
                await worker.calculateTextHash(data.algorithm, data.text, data.preferWasm);
                break;
            case MESSAGE_TYPES.START_CALCULATION:
                await worker.startCalculation(data.file, data.algorithm, data.useWasm, data.chunkSize);
                break;
            case MESSAGE_TYPES.CANCEL:
            case MESSAGE_TYPES.STOP:
                worker.stop();
                break;
            case MESSAGE_TYPES.RESET:
                worker.reset();
                break;
            default:
                console.warn('UnifiedHashWorker: Unknown message type:', type);
        }
    } catch (error) {
        console.error('UnifiedHashWorker: Error handling message:', error);
        self.postMessage({
            type: MESSAGE_TYPES.ERROR,
            message: error.message
        });
    }
};

// Error handling
self.onerror = function (error) {
    console.error('UnifiedHashWorker: Worker error:', error);
    self.postMessage({
        type: MESSAGE_TYPES.ERROR,
        message: error.message || 'Unknown worker error'
    });
};

console.log('UnifiedHashWorker: Worker script loaded');