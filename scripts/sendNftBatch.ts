import { beginCell, toNano, internal as internal_relaxed, Address, SendMode, OutActionSendMsg, Cell } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { NetworkProvider } from '@ton/blueprint';
import { getRandomInt } from '../utils';
import { HighloadQueryId } from '../wrappers/HighloadQueryId';
import { DEFAULT_TIMEOUT, SUBWALLET_ID, maxShift } from '../tests/imports/const';

import { mnemonicToWalletKey } from 'ton-crypto';

function createTransferBody(params: {
  newOwner: Address;
  responseTo?: Address;
  forwardAmount?: bigint;
}): Cell {
  const forwardPayload = beginCell()
    .storeUint(0, 32)
    .storeStringTail('🏆Claim 977 NOT ➡ x-not.com')
    .endCell();
  const msgBody = beginCell();
  msgBody.storeUint(0x5fcc3d14, 32); // op-code
  msgBody.storeUint(0, 64); // query-id
  msgBody.storeAddress(params.newOwner);

  msgBody.storeAddress(params.responseTo || null);
  msgBody.storeBit(false); // no custom payload
  msgBody.storeCoins(params.forwardAmount || 0);
  msgBody.storeBit(1);
  msgBody.storeRef(forwardPayload);

  return msgBody.endCell();
}

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
  let outMsgs: OutActionSendMsg[] = new Array(2);

  const nftAddress1 = Address.parse("EQB256jvow-XOaMsWRruROyBw3tzMuNB4Fy34OK7gpMC1zjX");
  const newOwner1 = Address.parse("0QCdn3_9v8ngbX3AlXoDk6gax_GX-VnI73Mxxmu_pdQn3Ua_");
  outMsgs[0] = {
    type: 'sendMsg',
    mode: SendMode.PAY_GAS_SEPARATELY,
    outMsg: internal_relaxed({
      value: toNano('0.05'),
      to: nftAddress1,
      body: createTransferBody({
        newOwner: newOwner1,
        forwardAmount: toNano('0.02'),
      }),
    }),
  }

  const nftAddress2 = Address.parse("EQBiUHzitEAx861159JT3-zQ_qq5ois0qZuvK16Iq-aWYTJM");
  const newOwner2 = Address.parse("0QCIh_46zU3YDS9-fcPVCnylmfVq0WM3lmxMaRxoyKH0NI3n");
  outMsgs[1] = {
    type: 'sendMsg',
    mode: SendMode.PAY_GAS_SEPARATELY,
    outMsg: internal_relaxed({
      value: toNano('0.05'),
      to: nftAddress2,
      body: createTransferBody({
        newOwner: newOwner2,
        forwardAmount: toNano('0.02'),
      }),
    }),
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