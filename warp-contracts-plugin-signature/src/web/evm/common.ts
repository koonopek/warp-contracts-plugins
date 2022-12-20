import Transaction, { Tag } from 'arweave/web/lib/transaction';
import { encodeTxId } from '../utils';
import { stringify } from 'safe-stable-stringify';
import { utils } from 'ethers';
import { SmartWeaveTags, TagsParser } from 'warp-contracts/web';
import { Interaction } from './evmSignatureVerification';


export type Signer = (signerAddress: string, toSign: string, tx: Transaction) => Promise<string> | string;
export type Owner = (tx: Transaction) => Promise<string> | string;

export const createEvmSigner = (signer: Signer, getOwner: Owner) => async (tx: Transaction) => {
  const owner = await getOwner(tx);

  let txToSign = assembleEvmTransaction(tx, utils.getAddress(owner));

  const signature = await signer(owner, stringify(txToSign), tx);

  await attachSignature(tx, signature);
};

export const assembleEvmTransaction = (tx: Transaction, ownerAddress: string) => {
  tx.owner = ownerAddress;

  attachEvmTags(tx);

  const tagsParser = new TagsParser();
  const decodedTags = tagsParser.decodeTags(tx);

  const isContractOrSource = decodedTags.some(
    (tag: Tag) => tag.name === SmartWeaveTags.APP_NAME &&
      (tag.value === 'SmartWeaveContract' || tag.value === 'SmartWeaveContractSource')
  );

  let txToSign: Interaction | Transaction;

  if (isContractOrSource) {
    txToSign = tx;
  } else {
    txToSign = {
      owner: { address: tx.owner },
      recipient: tx.target,
      tags: tx.tags,
      fee: {
        winston: tx.reward
      },
      quantity: {
        winston: tx.quantity
      }
    };
  }

  return txToSign;
}

export const attachEvmTags = (tx: Transaction) => {
  tx.addTag('Signature-Type', 'ethereum');
  tx.addTag('Nonce', Date.now().toString());
}

export const attachSignature = async (tx: Transaction, signature: string) => {
  tx.signature = signature;
  tx.id = await encodeTxId(tx.signature);
}

