# Set Account Operator

Minimal React + Vite + TypeScript app to call `setAccountOperator(uint8,address,address,bool)` on Plasma chain using ForDeFi wallet (EIP-1193).

## Prerequisites

- Browser with **ForDeFi** wallet installed (EIP-1193 compatible)
- Node.js 18+

## Setup

```bash
npm install
```

## Configuration

**IMPORTANT:** Before running, update `src/contract.ts` with the correct Plasma chain ID:

```typescript
export const TARGET_CHAIN = {
  chainIdHex: "0x????", // TODO: Fill with Plasma chain ID in hex (e.g., "0x13e31")
  chainIdDec: "????",   // TODO: Fill with Plasma chain ID in decimal (e.g., "81457")
  name: "Plasma",
  blockExplorerUrls: ["https://plasmascan.to/"]
};
```

## Run

```bash
npm run dev
```

Visit `http://localhost:5173` and connect your ForDeFi wallet.

## Features

- Connect to ForDeFi wallet
- Auto-detect chain mismatch and offer to switch/add Plasma network
- Estimate gas for the transaction
- Simulate call with `staticCall`
- Send transaction with optional gas buffer
- Track transaction status (pending → confirmed)
- View transaction on Plasmascan
- Copy transaction hash
- Persist last transaction hash in localStorage

## Contract Details

- **Address:** `0x7bdbd0A7114aA42CA957F292145F6a931a345583`
- **Function:** `setAccountOperator(uint8 opType, address account, address operator, bool approved)`
- **Fixed Args:**
  - `opType`: 0
  - `account`: 0xa1ff1458aad268b846005ce26d36ec6a7fc658d8
  - `operator`: 0xE2fE67f1adef59621EdCdAd890dC7b9E31eC68a8
  - `approved`: false

## Tech Stack

- React 18
- TypeScript
- Vite 6
- ethers.js v6
- CSS Modules (minimal, no framework)
