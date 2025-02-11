"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWalletsFromFile = exports.loadJSONConfig = void 0;
exports.sendRequest = sendRequest;
exports.batchProcess = batchProcess;
const promises_1 = __importDefault(require("fs/promises"));
const fsync = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const Logger_1 = require("./Logger");
const https_proxy_agent_1 = require("https-proxy-agent");
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const parse_proxy_1 = __importDefault(require("@devhigley/parse-proxy"));
const strip_json_comments_1 = __importDefault(require("strip-json-comments"));
/**
 * Loads a JSON configuration file.
 * @param filePath - Path to the configuration file.
 * @returns Parsed JSON object.
 */
const loadJSONConfig = (filePath) => {
    const configPath = path.resolve(__dirname, filePath);
    if (!fsync.existsSync(configPath)) {
        throw new Error(`Config file not found: ${configPath}`);
    }
    return JSON.parse((0, strip_json_comments_1.default)(fsync.readFileSync(configPath, "utf8")));
};
exports.loadJSONConfig = loadJSONConfig;
/**
 * Loads wallet public keys   from a text file.
 * @param filePath - Path to the wallets file.
 * @returns Array of PublicKey objects.
 */
const loadWalletsFromFile = (filePath) => {
    const walletsPath = path.resolve(__dirname, filePath);
    if (!fsync.existsSync(walletsPath)) {
        throw new Error(`Wallets file not found: ${walletsPath}`);
    }
    const lines = fsync.readFileSync(walletsPath, "utf8").trim().split("\n");
    return lines.map((line) => line.trim());
};
exports.loadWalletsFromFile = loadWalletsFromFile;
async function getRandomProxy() {
    try {
        const data = fsync.readFileSync('./data/proxies.txt', 'utf-8');
        const proxies = data.trim().split('\n').filter(line => line);
        if (proxies.length === 0) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'No proxies found in proxies.txt');
            throw new Error('No proxies found in proxies.txt');
        }
        const proxyStr = proxies[Math.floor(Math.random() * proxies.length)];
        const proxy = (0, parse_proxy_1.default)(proxyStr);
        return proxy[0];
    }
    catch (error) {
        console.error('Error reading proxies file:', error);
        throw error;
    }
}
async function sendRequest(url, timeout) {
    let axiosConfig = { timeout };
    if (GlobalConfig_1.default.getInstance().USE_PROXY) {
        try {
            const proxy = await getRandomProxy();
            const proxyUrl = `http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`;
            const agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
            axiosConfig.httpsAgent = agent;
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Failed to set proxy:' + error.message);
            throw error;
        }
    }
    try {
        const response = await axios_1.default.get(url, axiosConfig);
        return response;
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Request failed:' + error);
        return null;
    }
}
const RESULTS_DIR = './results';
function getLocalDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}
function saveResultToFile(result, operationName, batchDateTime) {
    switch (result.status) {
        case 'Error':
            appendToFile(`failed_${operationName}.txt`, result.wallet);
            break;
        case 'Skipped':
            appendToFile(`skipped_${operationName}.txt`, result.wallet);
            break;
        case 'Success':
            appendToFile(`success_${operationName}.txt`, result.wallet);
            break;
        default:
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Unexpected status, when saving ${operationName} result to log file: ${result.status}`);
    }
}
async function ensureResultsDirectory() {
    try {
        await promises_1.default.access(RESULTS_DIR);
    }
    catch {
        await promises_1.default.mkdir(RESULTS_DIR);
    }
}
async function appendToFile(filename, content) {
    const filepath = path.join(RESULTS_DIR, filename);
    await promises_1.default.appendFile(filepath, content + '\n', 'utf-8');
}
async function batchProcess(items, operation, threads, delayMs = 2000, operationName = 'operation') {
    try {
        await ensureResultsDirectory();
        const batchDateTime = getLocalDateTime();
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Items to process: ${items.length}`);
        const chunkSize = Math.ceil(items.length / threads);
        const chunks = Array.from({ length: threads }, (_, i) => items.slice(i * chunkSize, (i + 1) * chunkSize)).filter(chunk => chunk.length > 0);
        const chunkResults = await Promise.all(chunks.map(async (chunk) => {
            const results = [];
            for (const item of chunk) {
                const result = await operation(item);
                saveResultToFile(result, operationName, batchDateTime);
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            return results;
        }));
        const results = chunkResults.flat();
        const failed = results.filter(r => r.status === 'Error').length;
        const skipped = results.filter(r => r.status === 'Skipped').length;
        const successful = results.filter(r => r.status === 'Success').length;
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Failed: ${failed}`);
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Skipped: ${skipped}`);
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Successfully processed: ${successful}`);
        return results;
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Critical error in batch process '${operationName}': ${error}`);
        throw error;
    }
}
