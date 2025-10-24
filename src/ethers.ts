import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function getProvider(): ethers.BrowserProvider | null {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<ethers.JsonRpcSigner | null> {
  const provider = getProvider();
  if (!provider) return null;
  return await provider.getSigner();
}

export async function switchNetwork(chainIdHex: string, chainConfig?: any) {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    // Chain not added, try adding it
    if (switchError.code === 4902 && chainConfig) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [chainConfig],
        });
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
}
