import { subscribeLatest } from '@agoric/notifier';
import {
  makeAgoricChainStorageWatcher,
  AgoricChainStoragePathKind as Kind,
} from '@agoric/rpc';
import {
  makeAgoricWalletConnection,
  suggestChain,
} from '@agoric/web-components';

export const ENDPOINTS = {
  RPC: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
  API: process.env.NEXT_PUBLIC_LCD_ENDPOINT,
};
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
if (!chainId) {
  throw new Error('Missing chain ID');
}
if (!ENDPOINTS.RPC || !ENDPOINTS.API) {
  throw new Error('Missing RPC or API endpoint');
}
export const watcher = makeAgoricChainStorageWatcher(ENDPOINTS.API, chainId);
export type Wallet = Awaited<ReturnType<typeof makeAgoricWalletConnection>>;

const { fromEntries } = Object;
export const getdappInstance = async (instance: string) => {
  return new Promise(resolve => {
    watcher.watchLatest<Array<[string, unknown]>>(
      [Kind.Data, 'published.agoricNames.instance'],
      instances => {
        const agoricInstance = instances
          .find(([name]) => name === instance)!
          .at(1);
        resolve(agoricInstance);
      },
    );
  });
};

export const getBrands = async () => {
  return new Promise<Record<string, unknown>>(resolve => {
    watcher.watchLatest<Array<[string, unknown]>>(
      [Kind.Data, 'published.agoricNames.brand'],
      brands => {
        resolve(fromEntries(brands));
      },
    );
  });
};
export const connectWallet = async () => {
  const walletpurses: Array<Purse> = [];
  try {
    await suggestChain('https://local.agoric.net/network-config');
    const wallet = await makeAgoricWalletConnection(watcher, ENDPOINTS.RPC!);
    const { pursesNotifier } = wallet;
    for await (const purses of subscribeLatest(pursesNotifier)) {
      console.log('got purses', purses);
      walletpurses.push(purses);
    }
    return { wallet, walletpurses };
  } catch (err) {
    console.error('Error connecting wallet', err);
    throw err;
  }
};
