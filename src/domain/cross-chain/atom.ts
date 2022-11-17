import { atom } from 'jotai';

import { Chain, Token } from 'src/domain/chain/types';

import { chainAtom } from '../chain/atom';

export const crossChainTokenMap: Record<Chain, Token[]> = {
  polygon: [
    {
      address: '0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed',
      name: 'uusdc',
      symbol: 'axlUSDC',
      decimals: 6,
      logoURI: 'https://docs.axelar.dev/images/assets/usdc.svg',
    },
    {
      address: '0x6e4E624106Cb12E168E6533F8ec7c82263358940',
      name: 'uaxl',
      symbol: 'wAXL',
      decimals: 6,
      logoURI: 'https://docs.axelar.dev/images/assets/axl.svg',
    },
  ],
  BNB: [
    {
      address: '0x4268B8F0B87b6Eae5d897996E6b845ddbD99Adf3',
      name: 'uusdc',
      symbol: 'axlUSDC',
      decimals: 6,
      logoURI: 'https://docs.axelar.dev/images/assets/usdc.svg',
    },
    {
      address: '0x8b1f4432F943c465A973FeDC6d7aa50Fc96f1f65',
      name: 'uaxl',
      symbol: 'wAXL',
      decimals: 6,
      logoURI: 'https://docs.axelar.dev/images/assets/axl.svg',
    },
  ],
};

function checkExhaustChain(value: never): Chain {
  return 'polygon';
}

export function getCounterChain(chain: Chain): Chain {
  switch (chain) {
    case 'polygon':
      return 'BNB';
    case 'BNB':
      return 'polygon';
    default:
      return checkExhaustChain(chain);
  }
}

export function isCrossChain(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(/cross-chain/.test(window.location.pathname));
}

export const counterChainAtom = atom<Chain, Chain>(
  get => {
    return getCounterChain(get(chainAtom));
  },
  (_, set, chain) => {
    set(chainAtom, getCounterChain(chain));
  },
);

export const tokenAddressAtom = atom<string | undefined>(undefined);

export const tokenAtom = atom<Token | undefined, string | undefined>(
  get => {
    const chain = get(chainAtom);
    return crossChainTokenMap[chain].find(x => x.address === get(tokenAddressAtom));
  },
  (get, set, address) => {
    set(tokenAddressAtom, address);
  },
);

export const counterTokenAddressAtom = atom<string | undefined, string | undefined>(
  get => {
    const token = get(tokenAtom);
    if (!token) {
      return undefined;
    }
    const counterChain = get(counterChainAtom);
    const counterChainTokenList = crossChainTokenMap[counterChain];
    const counterToken = counterChainTokenList.find(x => x.symbol === token.symbol);
    if (counterToken) return counterToken.address;
  },
  (get, set, address) => {
    const chain = get(counterChainAtom);
    const counterToken = crossChainTokenMap[chain].find(
      x => x.address === get(counterTokenAddressAtom),
    );
    if (!counterToken) return;

    const token = crossChainTokenMap[get(chainAtom)].find(x => x.symbol === counterToken.symbol);
    if (!token) return;
    set(tokenAtom, token.address);
  },
);

export const counterTokenAtom = atom<Token | undefined, string | undefined>(
  get => {
    const chain = get(counterChainAtom);
    return crossChainTokenMap[chain].find(x => x.address === get(counterTokenAddressAtom));
  },
  (get, set, address) => {
    set(counterTokenAddressAtom, address);
  },
);

/** @deprecated this is no longer in use 
export const crossChainSwapEndpointsAtom = atom<AxelarEndpoint[]>(get => {
  // fromChain [tokenInAdress] fromSymbol -> [fromOutToken] toSymbol

  // toChain [?] -> [tokenOutAddress]
  const fromSymbol = get(fromTokenAtom)?.symbol;
  const toSymbol = get(toTokenAtom)?.symbol;

  const fromInToken = get(fromTokenAtom);
  const fromOutToken = get(fromTokenListAtom).find(x => x.symbol === toSymbol);
  const toInToken = get(toTokenListAtom).find(x => x.symbol === fromSymbol);
  const toOutToken = get(toTokenAtom);

  if (
    !fromSymbol ||
    !toSymbol ||
    !fromOutToken ||
    !toInToken ||
    !fromInToken ||
    !toInToken ||
    !toOutToken
  )
    return [];
  return [
    {
      chain: get(chainAtom),
      endpoint: get(tokenEndpointAtom),
      from: fromInToken.address,
      to: fromOutToken.address,
      amount: new Decimal(get(tokenInAmountAtom)).mul(Math.pow(10, fromInToken.decimals)).toFixed(),
      fromSymbol,
      toSymbol,
    },
    {
      chain: get(counterChainAtom),
      endpoint: get(toTokenEndpoint),
      from: toInToken.address,
      to: toOutToken.address,
      amount: new Decimal(get(tokenInAmountAtom)).mul(Math.pow(10, toInToken.decimals)).toFixed(),
      fromSymbol,
      toSymbol,
    },
  ];
});

*/
