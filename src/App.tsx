import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProvider, getSigner, switchNetwork } from './ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CALL_ARGS, TARGET_CHAIN } from './contract';
import styles from './App.module.css';

type Status = 'idle' | 'estimating' | 'simulated' | 'pending' | 'confirmed' | 'error';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [toast, setToast] = useState<string>('');

  useEffect(() => {
    // Load last tx from localStorage
    const lastTx = localStorage.getItem('lastTxHash');
    if (lastTx) {
      setTxHash(lastTx);
    }

    if (!window.ethereum) return;

    // Listen to account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
    });

    // Listen to chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      setChainId(chainId);
    });

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const connectWallet = async () => {
    try {
      const provider = getProvider();
      if (!provider) {
        setMessage('ForDeFi wallet not detected. Please install an EIP-1193 compatible wallet.');
        setStatus('error');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const network = await provider.getNetwork();
      setChainId('0x' + network.chainId.toString(16));

      setStatus('idle');
      setMessage('Wallet connected.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to connect wallet');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      const chainConfig = {
        chainId: TARGET_CHAIN.chainIdHex,
        chainName: TARGET_CHAIN.name,
        rpcUrls: TARGET_CHAIN.rpcUrls,
        nativeCurrency: TARGET_CHAIN.nativeCurrency,
        blockExplorerUrls: TARGET_CHAIN.blockExplorerUrls,
      };

      await switchNetwork(TARGET_CHAIN.chainIdHex, chainConfig);
      showToast('Network switched successfully');
    } catch (error: any) {
      if (error.code === 4001) {
        setMessage('User rejected network switch');
      } else {
        setMessage(error.message || 'Failed to switch network');
      }
      setStatus('error');
    }
  };

  const estimateGas = async () => {
    try {
      setStatus('estimating');
      setMessage('Estimating gas...');

      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const gas = await contract.setAccountOperator.estimateGas(
        CALL_ARGS.opType,
        CALL_ARGS.account,
        CALL_ARGS.operator,
        CALL_ARGS.approved
      );

      setEstimatedGas(gas);
      setStatus('idle');
      setMessage(`Estimated gas: ${gas.toString()} units`);
      showToast('Gas estimated successfully');
    } catch (error: any) {
      setStatus('error');
      if (error.code === 4001) {
        setMessage('User rejected transaction');
      } else if (error.data) {
        setMessage(`Revert: ${error.data}`);
      } else {
        setMessage(error.message || 'Gas estimation failed');
      }
    }
  };

  const simulate = async () => {
    try {
      setStatus('estimating');
      setMessage('Simulating call...');

      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      await contract.setAccountOperator.staticCall(
        CALL_ARGS.opType,
        CALL_ARGS.account,
        CALL_ARGS.operator,
        CALL_ARGS.approved
      );

      setStatus('simulated');
      setMessage('Simulation successful. Transaction would succeed.');
      showToast('Simulation successful');
    } catch (error: any) {
      setStatus('error');
      if (error.code === 4001) {
        setMessage('User rejected simulation');
      } else if (error.data) {
        setMessage(`Simulation revert: ${error.data}`);
      } else {
        setMessage(error.message || 'Simulation failed');
      }
    }
  };

  const sendTransaction = async () => {
    try {
      setStatus('pending');
      setMessage('Sending transaction...');

      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      let txOptions = {};
      if (estimatedGas) {
        const gasLimit = (estimatedGas * 110n) / 100n; // 10% buffer
        txOptions = { gasLimit };
      }

      const tx = await contract.setAccountOperator(
        CALL_ARGS.opType,
        CALL_ARGS.account,
        CALL_ARGS.operator,
        CALL_ARGS.approved,
        txOptions
      );

      setTxHash(tx.hash);
      localStorage.setItem('lastTxHash', tx.hash);
      setMessage(`Transaction sent. Hash: ${tx.hash}`);

      const provider = getProvider();
      if (provider) {
        const receipt = await provider.waitForTransaction(tx.hash);
        if (receipt) {
          setStatus('confirmed');
          setBlockNumber(receipt.blockNumber);
          setMessage(`Transaction confirmed in block ${receipt.blockNumber}`);
          showToast('Transaction confirmed!');
        }
      }
    } catch (error: any) {
      setStatus('error');
      if (error.code === 4001) {
        setMessage('User rejected transaction');
      } else if (error.data) {
        setMessage(`Transaction revert: ${error.data}`);
      } else {
        setMessage(error.message || 'Transaction failed');
      }
    }
  };

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      showToast('Transaction hash copied!');
    }
  };

  const isWrongChain = chainId && chainId !== TARGET_CHAIN.chainIdHex;
  const canInteract = account && !isWrongChain;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Set Account Operator</h1>
        <a
          href={`https://plasmascan.to/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Contract on Plasmascan →
        </a>
      </div>

      <div className={styles.panel}>
        <h2>Wallet</h2>
        {!account ? (
          <button onClick={connectWallet}>Connect ForDeFi Wallet</button>
        ) : (
          <>
            <div className={styles.walletInfo}>
              <div><strong>Address:</strong> {account}</div>
              <div><strong>Chain ID:</strong> {chainId || 'Unknown'}</div>
            </div>
            {isWrongChain && (
              <button className={styles.warning} onClick={handleSwitchNetwork}>
                Switch to {TARGET_CHAIN.name}
              </button>
            )}
          </>
        )}
      </div>

      <div className={styles.panel}>
        <h2>Call Parameters</h2>
        <div className={styles.argsGrid}>
          <div className={styles.argRow}>
            <label>opType:</label>
            <input type="text" value={CALL_ARGS.opType} readOnly />
          </div>
          <div className={styles.argRow}>
            <label>account:</label>
            <input type="text" value={CALL_ARGS.account} readOnly />
          </div>
          <div className={styles.argRow}>
            <label>operator:</label>
            <input type="text" value={CALL_ARGS.operator} readOnly />
          </div>
          <div className={styles.argRow}>
            <label>approved:</label>
            <input type="text" value={CALL_ARGS.approved.toString()} readOnly />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={estimateGas} disabled={!canInteract || status === 'pending'}>
            Estimate Gas
          </button>
          <button onClick={simulate} disabled={!canInteract || status === 'pending'}>
            Simulate
          </button>
          <button
            className={styles.secondary}
            onClick={sendTransaction}
            disabled={!canInteract || status === 'pending'}
          >
            Send Transaction
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <h2>Status</h2>
        <div
          className={`${styles.status} ${
            status === 'error' ? styles.error :
            status === 'confirmed' ? styles.success :
            status === 'pending' ? styles.pending : ''
          }`}
        >
          {message || 'Ready to interact with contract.'}
          {txHash && (
            <div style={{ marginTop: '0.5rem' }}>
              <a
                href={`https://plasmascan.to/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Plasmascan →
              </a>
              <button className={styles.copyButton} onClick={copyTxHash}>
                Copy Hash
              </button>
            </div>
          )}
          {blockNumber && (
            <div style={{ marginTop: '0.5rem' }}>
              Block: {blockNumber}
            </div>
          )}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

export default App;
