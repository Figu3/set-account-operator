export const CONTRACT_ADDRESS = "0x7bdbd0A7114aA42CA957F292145F6a931a345583";

export const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "setAccountOperator",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "opType", "type": "uint8" },
      { "name": "account", "type": "address" },
      { "name": "operator", "type": "address" },
      { "name": "approved", "type": "bool" }
    ],
    "outputs": []
  }
];

export const CALL_ARGS = {
  opType: 0,
  account: "0xa1ff1458aad268b846005ce26d36ec6a7fc658d8",
  operator: "0xE2fE67f1adef59621EdCdAd890dC7b9E31eC68a8",
  approved: false
};

export const TARGET_CHAIN = {
  chainIdHex: "0x????", // TODO: Fill with Plasma chain ID in hex
  chainIdDec: "????",   // TODO: Fill with Plasma chain ID in decimal
  name: "Plasma",
  blockExplorerUrls: ["https://plasmascan.to/"]
};
