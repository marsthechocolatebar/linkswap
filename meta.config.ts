import { ethers } from 'ethers';
import { DefaultSeoProps } from 'next-seo';

import { Chain } from 'src/domain/chain/types';

interface ChainMetaData {
  metamaskParams: {
    chainId: string;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string; // 2-6 characters long
      decimals: 18;
    };
  };

  apiEndpoint: string;
  getBlockExplorerUrl: (hash: string) => string;
  /** wrapped native token의 가격은 native token의 가격을 바라봐야 한다. getPriceInUSDC에서 사용 */
  nativeToken: string;
  wrappedNativeToken: string;
  routeProxyAddress: string;
  approveProxyAddress: string;
}

interface MetaConfig {
  commonApiEndpoint: string;
  chain: {
    defaultChain: Chain;
    chainList: Chain[];
    metaData: Record<Exclude<Chain, 'Axelar'>, ChainMetaData>;
  };
  navigation: {
    serviceName: string;
    logoURL: string;
    height: number | undefined;
  };
  seo: DefaultSeoProps;
}

const config: MetaConfig = {
  commonApiEndpoint: 'https://api.eisenfinance.com',
  chain: {
    defaultChain: 'BNB',
    chainList: ['BNB', 'polygon'],
    metaData: {
      BNB: {
        metamaskParams: {
          chainId: ethers.utils.hexlify(56),
          chainName: 'Binance Smart Chain Mainnet',
          rpcUrls: ['https://bsc-dataseed.binance.org'],
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB', // 2-6 characters long
            decimals: 18,
          },
        },
        nativeToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        wrappedNativeToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
        apiEndpoint: 'https://api-bsc.eisenfinance.com',
        getBlockExplorerUrl: (txHash: string) => `https://bscscan.com/tx/${txHash}`,
        routeProxyAddress: '0x208dA73F71fE00387C3fe0c4D71b77b39a8D1c5D',
        approveProxyAddress: '0xaf957563450b124655Af816c1D947a647bac62D1',
      },
      polygon: {
        metamaskParams: {
          chainId: ethers.utils.hexlify(137),
          chainName: 'Polygon Mainnet',
          rpcUrls: ['https://polygonapi.terminet.io/rpc'],
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC', // 2-6 characters long
            decimals: 18,
          },
        },
        nativeToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        wrappedNativeToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        apiEndpoint: 'https://api-polygon.eisenfinance.com',
        getBlockExplorerUrl: (txHash: string) => `https://polygonscan.com/tx/${txHash}`,
        routeProxyAddress: '0x0cd6e5E6005f12AE69Df563594dceC2D79eD6018',
        approveProxyAddress: '0xfD5e09842bd805F7002F723306ffdd0E11346A34',
      },
    },
  },
  navigation: {
    serviceName: 'LinkSwap',
    logoURL: 'link-swap-logo.svg',
    height: 200,
  },
  seo: {
    title: 'LinkSwap',
    description: '',
    additionalLinkTags: [
      {
        rel: 'icon',
        href: '',
      },
    ],
    openGraph: {
      title: '',
      type: 'website',
      url: '',
      description: '',
      images: [
        {
          url: '',
          type: 'image/png',
        },
      ],
      site_name: '',
    },
  },
};

export default config;
