import { beginCell, toNano, internal as internal_relaxed, Address, SendMode } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { NetworkProvider } from '@ton/blueprint';
import { getRandomInt } from '../utils';
import { HighloadQueryId } from '../wrappers/HighloadQueryId';
import { DEFAULT_TIMEOUT, SUBWALLET_ID, maxShift } from '../tests/imports/const';

import { mnemonicToWalletKey } from 'ton-crypto';
import { promptAddress } from '../utils/ui';

export async function run(provider: NetworkProvider) {
  // Load mnemonic from .env file
  const mnemonic = process.env.WALLET_MNEMONIC!.split(' ');
  const keyPair = await mnemonicToWalletKey(mnemonic);

  // const highloadWalletV3Address = await promptAddress('Enter your highload-wallet-v3 address: ', provider.ui());
  const highloadWalletV3Address = Address.parse("EQDYZAIgSnRPtqirqZTTIBFc3VYdzw4bVLRxKFJQmlJt5rOc");
  const highloadWalletV3 = provider.open(HighloadWalletV3.createFromAddress(highloadWalletV3Address));

  const rndShift = getRandomInt(0, maxShift);
  const rndBitNum = 1022;

  // You can pack your own messages here
  const testBody = beginCell().storeUint(0, 32).storeStringTail('🏆Claim 977 NOT ➡ x-not.com').endCell();
  const queryId = HighloadQueryId.fromShiftAndBitNumber(BigInt(rndShift), BigInt(rndBitNum));

  await highloadWalletV3.sendExternalMessage(keyPair.secretKey, {
    query_id: queryId,
    message: internal_relaxed({
      to: Address.parse('UQCIh_46zU3YDS9-fcPVCnylmfVq0WM3lmxMaRxoyKH0NDZt'),
      bounce: false,
      value: toNano('0'),
      body: testBody,
    }),
    createdAt: Math.floor(Date.now() / 1000) - 10,
    mode: SendMode.PAY_GAS_SEPARATELY,
    subwalletId: SUBWALLET_ID,
    timeout: DEFAULT_TIMEOUT,
  });
}