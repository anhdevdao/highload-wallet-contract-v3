import { beginCell, toNano, internal as internal_relaxed, Address, SendMode, OutActionSendMsg } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { NetworkProvider } from '@ton/blueprint';
import { getRandomInt } from '../utils';
import { HighloadQueryId } from '../wrappers/HighloadQueryId';
import { DEFAULT_TIMEOUT, SUBWALLET_ID, maxShift } from '../tests/imports/const';

import { mnemonicToWalletKey } from 'ton-crypto';
import { promptAddress, promptAmount, toUnits } from '../utils/ui';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';
import { randomAddress } from '@ton/test-utils';

export async function run(provider: NetworkProvider) {
  // Load mnemonic from .env file
  const mnemonic = process.env.WALLET_MNEMONIC!.split(' ');
  const keyPair = await mnemonicToWalletKey(mnemonic);

  const highloadWalletV3Address = Address.parse(process.env.HIGHLOAD_WALLET_V3_CONTRACT!);
  const highloadWalletV3 = provider.open(HighloadWalletV3.createFromAddress(highloadWalletV3Address));

  const rndShift = getRandomInt(0, maxShift);
  const rndBitNum = 1022;
  const queryId = HighloadQueryId.fromShiftAndBitNumber(BigInt(rndShift), BigInt(rndBitNum));

  const curQuery = new HighloadQueryId();
  let outMsgs: OutActionSendMsg[] = new Array(10);

  // You can pack your own messages here
  const jettonMasterAddress = Address.parse("kQAA53BnRjnoYH7xPGxNzz62fj-wo9F6q5jj_jfesoFgCzLG");
  const decimals = 9;

  const jettonMaster = provider.open(JettonMinter.createFromAddress(jettonMasterAddress));
  const hwJettonWalletAddress = await jettonMaster.getWalletAddress(highloadWalletV3Address);
  // const hwJettonWallet = provider.open(JettonWallet.createFromAddress(hwJettonWalletAddress));

  const forwardPayload = beginCell()
    .storeUint(0, 32)
    .storeStringTail('🏆Claim 977 NOT ➡ x-not.com')
    .endCell();

  const len = outMsgs.length;
  for (let i = 0; i < len; i++) {
    // const to = Address.parse("0QCIh_46zU3YDS9-fcPVCnylmfVq0WM3lmxMaRxoyKH0NI3n");
    const to = randomAddress();
    const transferBody = JettonWallet.transferMessage(
      toUnits("0.01", decimals),
      to,
      highloadWalletV3Address, // sender
      null,
      1n,
      forwardPayload,
    );
    outMsgs[i] = {
      type: 'sendMsg',
      mode: SendMode.PAY_GAS_SEPARATELY,
      outMsg: internal_relaxed({
        to: hwJettonWalletAddress,
        bounce: false,
        value: toNano('0.1'),
        body: transferBody,
      }),
    }
  }

  await highloadWalletV3.sendBatch(
    keyPair.secretKey,
    outMsgs,
    SUBWALLET_ID,
    curQuery,
    DEFAULT_TIMEOUT,
    Math.floor(Date.now() / 1000) - 10,
  )
}