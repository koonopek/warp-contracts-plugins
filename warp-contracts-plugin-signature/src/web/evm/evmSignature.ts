import { createEvmSigner } from "./common";
import MetaMaskOnboarding from '@metamask/onboarding';
import { MetaMaskInpageProvider } from '@metamask/providers';
import stringify from "safe-stable-stringify";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}
export const evmSignature = createEvmSigner(
  signWithMetaMask,
  getMetaMaskAccount
)

async function signWithMetaMask(owner: string, txToSign: string) {
    return await window.ethereum.request<string>({
        method: 'personal_sign',
        params: [owner[0], stringify(txToSign)]
    });
}

async function getMetaMaskAccount() {
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
        throw new Error('Account could not be loaded. Metamask not detected');
    }

    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    return accounts[0];
}
