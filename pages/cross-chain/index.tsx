import React, { ChangeEvent, useState } from 'react';

import type { GetServerSideProps } from 'next';

import {
  AxelarAssetTransfer,
  AxelarQueryAPI,
  Environment,
  EvmChain,
} from '@axelar-network/axelarjs-sdk';
import { ArrowUpDownIcon } from '@chakra-ui/icons';
import { Box, Divider, Flex, HStack, Button, IconButton, useToast } from '@chakra-ui/react';
import { BigNumber, ethers } from 'ethers';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';

import config from 'meta.config';
import SlippageInput from 'src/components/SlippageInput';
import TokenAmountInput from 'src/components/TokenAmountInput';
import { chainAtom, defaultTokenList } from 'src/domain/chain/atom';
import { Token } from 'src/domain/chain/types';
import {
  counterChainAtom,
  counterTokenAtom,
  crossChainTokenMap,
  tokenAtom,
} from 'src/domain/cross-chain/atom';
import { balanceFetchKey, slippageRatioAtom } from 'src/domain/swap/atom';
import { useWallet } from 'src/hooks/useWallet';
import useWalletEffect from 'src/hooks/useWalletEffect';
import { logger } from 'src/utils/logger';
import { filterDecimal, removeDotExceptFirstOne } from 'src/utils/with-comma';

import styles from '../Swap.module.scss';

export const getServerSideProps: GetServerSideProps<{
  defaultTokenList: Token[];
}> = async context => {
  return { props: { defaultTokenList } };
};

const CrossChain = () => {
  useWalletEffect();

  const chain = useAtomValue(chainAtom);

  const { address, sendTransaction, walletExtension } = useWallet();
  const toast = useToast();

  const [token, setTokenAddress] = useAtom(tokenAtom);
  const [counterToken, setCounterTokenAddress] = useAtom(counterTokenAtom);

  const [isMetaMaskSwitching, setIsMetaMaskSwitching] = useState(false);

  const [stringAmount, setStringAmount] = useState('');

  const tokenInAmount = parseFloat(removeDotExceptFirstOne(filterDecimal(stringAmount)));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;
    const [integer] = value.split('.');
    if (integer && integer.length > 10) {
      return;
    }
    setStringAmount(removeDotExceptFirstOne(value));
  };

  const [slippageRatio, setSlippageRatio] = useAtom(slippageRatioAtom);

  const counterChain = useAtomValue(counterChainAtom);

  const [isSwapLoading, setIsSwapLoading] = useState(false);

  const updateFetchKey = useSetAtom(balanceFetchKey);

  const handleClickReverse = useAtomCallback((get, set) => {
    if (!walletExtension) {
      toast({
        title: 'Waiting for metamask to be loaded',
        description: 'Sorry. please try again',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsMetaMaskSwitching(true);
    const counterChain = get(counterChainAtom);
    walletExtension
      .switchChain(counterChain)
      .then((isSwitched: boolean) => {
        if (isSwitched) {
          set(chainAtom, counterChain);
          setStringAmount('0');
        }
        setIsMetaMaskSwitching(false);
      })
      .catch(e => {
        setIsMetaMaskSwitching(false);
      });
  });

  const handleClickSwap = async () => {
    if (!address || !token || !counterToken) return;

    if (!walletExtension) return;

    setIsSwapLoading(true);
    const sdk = new AxelarAssetTransfer({
      environment: 'mainnet',
      auth: 'metamask',
    });
    const api = new AxelarQueryAPI({
      environment: Environment.MAINNET,
    });

    const denomOfAsset = await api.getDenomFromSymbol(counterToken.symbol, counterChain);
    if (!denomOfAsset) {
      setIsSwapLoading(false);
      throw new Error('denom not found');
    }

    const depositAddress = await sdk.getDepositAddress(
      chain === 'BNB' ? EvmChain.BINANCE : chain, // source chain
      counterChain === 'BNB' ? EvmChain.BINANCE : counterChain, // destination chain
      token.address, // destination address
      denomOfAsset, // denom of asset. See note (2) below
    );

    const isSwitched = await walletExtension.switchChain(chain);

    if (!isSwitched) return;

    const provider = new ethers.providers.Web3Provider(
      window.ethereum as unknown as ethers.providers.ExternalProvider,
    );

    try {
      const txHash = await sendTransaction({
        from: address,
        to: depositAddress,
        value: BigNumber.from(tokenInAmount * Math.pow(10, token.decimals)).toHexString(),
      });

      if (!txHash) throw new Error('invalid transaction!');

      const toastId = toast({
        title: 'Success!',
        description: `Your transaction has sent: ${txHash}`,
        status: 'success',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });

      const receipt = await provider.waitForTransaction(txHash);
      updateFetchKey(+new Date());
      if (receipt) {
        // success
        if (toastId) toast.close(toastId);
        toast({
          title: 'Success!',
          description: (
            <a
              href={config.chain.metaData[chain]?.getBlockExplorerUrl(
                txHash,
              )}>{`Your transaction(${txHash}) is approved!`}</a>
          ),
          status: 'success',
          position: 'top-right',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // fail
      }
      logger.debug('txhash', txHash);
    } catch (e) {
      logger.error(e);
      toast({
        title: 'Failed to send transaction',
        description: 'Sorry. Someting went wrong, please try again',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSwapLoading(false);
    }
  };

  return (
    <>
      <main className={styles.main}>
        <Box
          className={styles['swap-container']}
          padding={12}
          paddingTop={6}
          w={['100%', '80%', '80%', '50%']}
          maxW="500px"
          borderRadius={8}>
          <Box h={3} />
          <HStack justifyContent="flex-end">
            <HStack spacing={4}></HStack>
            {/* <IconButton aria-label="swap settings" variant="outline" icon={<SettingsIcon />} /> */}
          </HStack>

          <Box h={4} />

          <TokenAmountInput
            tokenAddress={token?.address}
            amount={stringAmount}
            handleChange={handleChange}
            modalHeaderTitle={`You Sell`}
            label={`You Sell in ${chain}`}
            showBalance={!!address}
            tokenList={crossChainTokenMap[chain]}
            chain={chain}
            decimals={token?.decimals ?? 0}
            onBalanceClick={balance => {
              setStringAmount(balance);
            }}
            onTokenSelect={selected => {
              setTokenAddress(selected.address);
            }}
          />

          <Flex alignItems="center" marginY={8}>
            <Divider marginRight={4} />
            <IconButton
              disabled={isMetaMaskSwitching}
              aria-label="reverse-from-to"
              icon={<ArrowUpDownIcon />}
              variant="outline"
              onClick={handleClickReverse}
            />
            <Divider marginLeft={4} />
          </Flex>

          <TokenAmountInput
            tokenAddress={counterToken?.address}
            amount={tokenInAmount}
            isReadOnly
            modalHeaderTitle="You Buy"
            label={`You Buy in ${counterChain}`}
            tokenList={crossChainTokenMap[counterChain]}
            chain={counterChain}
            decimals={counterToken?.decimals ?? 0}
            onTokenSelect={selected => {
              setCounterTokenAddress(selected.address);
            }}
          />

          <Box w="100%" h={12} />

          <SlippageInput value={slippageRatio} setValue={setSlippageRatio} />

          <Box w="100%" h={12} />

          <Button
            isDisabled={!address}
            isLoading={isSwapLoading}
            w="100%"
            size="lg"
            height={['48px', '54px', '54px', '64px']}
            fontSize={['md', 'lg', 'lg', 'xl']}
            opacity={1}
            colorScheme="primary"
            onClick={handleClickSwap}>
            Swap
          </Button>
        </Box>
      </main>
    </>
  );
};

export default CrossChain;
