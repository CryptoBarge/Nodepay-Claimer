"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const Utils_1 = require("./Utils");
const Logger_1 = require("./Logger");
class GlobalConfig {
    // Hide the constructor.
    constructor() { }
    // Singleton getter.
    static getInstance() {
        if (!GlobalConfig.instance) {
            GlobalConfig.instance = new GlobalConfig();
        }
        return GlobalConfig.instance;
    }
    // Common function for required config values.
    // If the value is missing, logs an error message and exits the process.
    static requireConfigValue(value, errorMessage) {
        // Check for undefined, null, empty string, or an empty array.
        if (value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "") ||
            (Array.isArray(value) && value.length === 0)) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, errorMessage);
            process.exit(1);
        }
        return value;
    }
    // Lazy-load and cache the config JSON.
    get config() {
        if (!this._config) {
            this._config = (0, Utils_1.loadJSONConfig)("../data/config.json");
            if (!this._config) {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, "Failed to load configuration from ../data/config.json");
                process.exit(1);
            }
        }
        return this._config;
    }
    // Each getter loads its value only on first access
    get VAULT_WALLET() {
        if (!this._vaultWallet) {
            // Use the common function to require a value.
            const vaultWalletStr = GlobalConfig.requireConfigValue(this.config.VAULT_WALLET, "Missing VAULT_WALLET in config file (../data/config.json).");
            try {
                this._vaultWallet = new web3_js_1.PublicKey(vaultWalletStr);
            }
            catch (error) {
                throw new Error(`Invalid VAULT_WALLET in config file: ${error.message}`);
            }
        }
        return this._vaultWallet;
    }
    get MASTER_WALLET() {
        this._masterWallet = this.config.MASTER_WALLET ? web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(this.config.MASTER_WALLET)) : undefined;
        return this._masterWallet;
    }
    get FROM_WALLET() {
        if (!this._fromWallet) {
            const fromWalletStr = GlobalConfig.requireConfigValue(this.config.FROM_WALLET, "missing FROM_WALLET in config file (../data/config.json).");
            try {
                this._fromWallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(fromWalletStr));
            }
            catch (error) {
                throw new Error(`Invalid FROM_WALLET in config file: ${error.message}`);
            }
        }
        return this._fromWallet;
    }
    get MINT_ADDRESS() {
        if (!this._mintAddress) {
            // Hard-coded mint address.
            try {
                this._mintAddress = new web3_js_1.PublicKey("B89Hd5Juz7JP2dxCZXFJWk4tMTcbw7feDhuWGb3kq5qE");
            }
            catch (error) {
                throw new Error(`Invalid MINT_ADDRESS: ${error.message}`);
            }
        }
        return this._mintAddress;
    }
    get TIP_PERCENTAGE() {
        if (this._tipPercentage === undefined) {
            const tipAmount = GlobalConfig.requireConfigValue(this.config.TIP_AMOUNT, "Missing TIP_AMOUNT in config file (../data/config.json).");
            // Convert to basis points (i.e., TIP_AMOUNT * 100).
            this._tipPercentage = BigInt(tipAmount * 100);
        }
        return this._tipPercentage;
    }
    get WALLETS() {
        if (!this._wallets) {
            this._wallets = (0, Utils_1.loadWalletsFromFile)("../data/wallets.txt");
            if (!this._wallets || this._wallets.length === 0 || this._wallets.every(wallet => wallet.trim() === "")) {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, "Wallets file ../data/wallets.txt is empty");
                process.exit(1);
            }
        }
        return this._wallets;
    }
    get CHECKED_WALLETS() {
        if (!this._checkedWallets) {
            this._checkedWallets = (0, Utils_1.loadWalletsFromFile)("../data/checked_wallets.txt");
            GlobalConfig.requireConfigValue(this._checkedWallets, "Checked wallets file ../data/checked_wallets.txt is empty or missing required wallets.");
        }
        return this._checkedWallets;
    }
    get rpcEndpoint() {
        if (!this._rpcEndpoint) {
            const { RPC_ENDPOINT } = this.config;
            this._rpcEndpoint =
                RPC_ENDPOINT && RPC_ENDPOINT.trim() !== ""
                    ? RPC_ENDPOINT
                    : (0, web3_js_1.clusterApiUrl)("mainnet-beta");
        }
        return this._rpcEndpoint;
    }
    get CONNECTION() {
        if (!this._connection) {
            this._connection = new web3_js_1.Connection(this.rpcEndpoint, "confirmed");
        }
        return this._connection;
    }
    get MIN_TOKEN_AMOUNT() {
        if (this._minTokenAmount === undefined) {
            const minTokenAmount = GlobalConfig.requireConfigValue(this.config.MIN_TOKEN_AMOUNT, "Missing MIN_TOKEN_AMOUNT in config file (../data/config.json).");
            this._minTokenAmount = Number(minTokenAmount);
        }
        return this._minTokenAmount;
    }
    get THREADS() {
        if (this._threads === undefined) {
            const threads = GlobalConfig.requireConfigValue(this.config.THREADS, "Missing THREADS in config file (../data/config.json).");
            this._threads = threads;
        }
        return this._threads;
    }
    get USE_PROXY() {
        if (this._useProxy === undefined) {
            const useProxy = GlobalConfig.requireConfigValue(this.config.USE_PROXY, "Missing USE_PROXY in config file (../data/config.json).");
            this._useProxy = useProxy;
        }
        return this._useProxy;
    }
}
exports.default = GlobalConfig;
//# sourceMappingURL=GlobalConfig.js.map
