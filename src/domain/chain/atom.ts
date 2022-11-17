import { atom } from 'jotai';

import config from 'meta.config';
import bscTokenListJson from 'src/constant/token-list/bsc.json';
import polygonTokenListJson from 'src/constant/token-list/polygon.json';

import { crossChainTokenMap, getCounterChain, isCrossChain, tokenAtom } from '../cross-chain/atom';
import { tokenInAddressAtom, tokenOutAddressAtom } from '../swap/atom';
import { Chain, Token } from './types';

export const tokenListMap: Record<Chain, Token[]> = {
  polygon: polygonTokenListJson.result,
  BNB: bscTokenListJson.result,
};

export const chainList: Chain[] = config.chain.chainList;

export const defaultChain: Chain = config.chain.defaultChain;

export const defaultTokenList: Token[] = tokenListMap[defaultChain];

const chainPrimitiveAtom = atom<Chain>(defaultChain);

export const chainAtom = atom<Chain, Chain>(
  get => get(chainPrimitiveAtom),
  (_, set, newChain) => {
    set(chainPrimitiveAtom, newChain);

    if (isCrossChain()) {
      const chainTokenList = crossChainTokenMap[newChain];
      const crossChainTokenList = crossChainTokenMap[getCounterChain(newChain)];

      if (chainTokenList.length == 0 || crossChainTokenList.length == 0) return;

      const tokenIn = chainTokenList[0];

      set(tokenAtom, tokenIn.address);
    }

    const updateList = tokenListMap[newChain];

    if (updateList.length > 1) {
      set(tokenInAddressAtom, updateList[0].address);
      set(tokenOutAddressAtom, updateList[1].address);
    }
  },
);

export const tokenListAtom = atom<Token[]>(get => {
  const chain = get(chainAtom);
  return tokenListMap[chain];
});
