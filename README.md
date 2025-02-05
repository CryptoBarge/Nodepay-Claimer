# 🧲 Nodepay-Claimer

<div>
<p align="center">
  <img src="./image/console.png" alt="Nodepay Claimer Console" width="600"/>
  
  <p align="center">
    <a href="https://t.me/CryptoBarge"><img src="https://img.shields.io/badge/CryptoBarge_|_Subscribe_⚓-5B00FF?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Channel"></a>
    <a href="https://t.me/+nbpTp74UTnVmMmM6"><img src="https://img.shields.io/badge/Crypto$БАРЖА_|_Chat_💬-5B00FF?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Chat"></a>
<p
</div>

## 🔎 Navigation

- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#%EF%B8%8F-configuration)
- [Usage](#-usage)

## 📑 Requirements

- Node.js

## 📥 Installation

1. **Clone the Repository**
   ```bash
   git clone [repository URL]
   ```
2. **Install Dependencies**
   ```bash
   npm install package.json
   ```

## ⚙️ Configuration

### 📁 config.json

```json
  "THREADS": 3
  "RPC_ENDPOINT": ""
  "USE_PROXY": false
  "VAULT_WALLET": ""
  "MASTER_WALLET": ""
  "TIP_AMOUNT": 0.1
  "MIN_TOKEN_AMOUNT": 50
```

### 📁 Input Files Structure

#### data/wallets.txt
```
2CQYCy8Jwer8t8ZPwhKDAhL17CNQWHojoLJGWE6Yj6uk5Po4xHcoW8XRnQzZjTsh3UNFq2UnRtQyxZx4UKXr92CJ
4QEYkSecKJgbiLyoNkLbufaXCyJz8AEGa26BqQpAepypCXucafgP1NoYSRKWWcmN1LfsFJLU1sod3RQsPmiorcWB
2jnkMifvFN5mrK5T8kmRdUQAZdVxWp4irLMNzUH29Ye5dQQ7qfKGfwMm6HQr87yNSP5twb8CV1NPCZS8zeRT5EHi
```

#### data/proxies.txt
```
http://user:pass@ip:port
http://ip:port:user:pass
socks5://user:pass@ip:port
```

## ⚠️ Important Notes

- 💸 **MultiSend $NC** - Sends tokens $NC from wallets.txt to VAULT_WALLET.
- 💰 **Consecutive-claim** - Claimed your token from wallets.txt, sends $NC to VAULT_WALLET, close ATA and send all balance $SOL to next wallet. (_You need to have enough solana on the first wallet from wallets.txt_)
- 🧲 **Claim $NC** - Claimed your token from wallets.txt.
- 💲 **ClaimYourSol** - Сlose ATA from wallet.txt, fee redeemed and sends $SOL to VAULT_WALET. FeePayer - MASTER_WALET. (_If there is no $SOL in the wallets, the transaction fee will be paid MASTER_WALET._)
- 🧮 **TokenCheker** - Filters wallets from wallet.txt by quantity tokens $NC allocation and writes the result to checked_wallets.txt.

## 🚀 Usage

1. Configure all necessary files as described above
2. Start the claimer:
   ```bash
   node console.js
   ```

## 📞 Support

Join our Telegram community for support:
- 📢 Channel: [CryptoBarge](https://t.me/CryptoBarge)
- 💬 Chat:    [Chat$БАРЖА](https://t.me/+nbpTp74UTnVmMmM6)
