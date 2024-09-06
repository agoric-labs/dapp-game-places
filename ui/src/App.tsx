import { useEffect } from 'react';

import './App.css';
import {
  makeAgoricChainStorageWatcher,
  AgoricChainStoragePathKind as Kind,
} from '@agoric/rpc';
import { create } from 'zustand';
import {
  makeAgoricWalletConnection,
  suggestChain,
} from '@agoric/web-components';
import { subscribeLatest } from '@agoric/notifier';
import { makeCopyBag } from '@agoric/store';
import { Logos } from './components/Logos';
import { Inventory } from './components/Inventory';
import { Subscribe } from './components/Trade';

import { AmountMath } from '@agoric/ertp';

const { entries, fromEntries } = Object;

export type Wallet = Awaited<ReturnType<typeof makeAgoricWalletConnection>>;

const ENDPOINTS = {
  RPC: 'http://localhost:26657',
  API: 'http://localhost:1317',
};

const codeSpaceHostName = import.meta.env.VITE_HOSTNAME;

const codeSpaceDomain = import.meta.env
  .VITE_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

if (codeSpaceHostName) {
  ENDPOINTS.API = `https://${codeSpaceHostName}-1317.${codeSpaceDomain}`;
  ENDPOINTS.RPC = `https://${codeSpaceHostName}-26657.${codeSpaceDomain}`;
}
if (codeSpaceHostName && codeSpaceDomain) {
  ENDPOINTS.API = `https://${codeSpaceHostName}-1317.${codeSpaceDomain}`;
  ENDPOINTS.RPC = `https://${codeSpaceHostName}-26657.${codeSpaceDomain}`;
} else {
  console.error(
    'Missing environment variables: VITE_HOSTNAME or VITE_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN',
  );
}
const watcher = makeAgoricChainStorageWatcher(ENDPOINTS.API, 'agoriclocal');

interface AppState {
  wallet?: Wallet;
  offerUpInstance?: unknown;
  brands?: Record<string, unknown>;
  purses?: Array<Purse>;
}

const useAppStore = create<AppState>(() => ({}));

const setup = async () => {
  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.instance'],
    instances => {
      console.log('got instances', instances);
      useAppStore.setState({
        offerUpInstance: instances.find(([name]) => name === 'offerUp')!.at(1),
      });
    },
  );

  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.brand'],
    brands => {
      console.log('Got brands', brands);
      useAppStore.setState({
        brands: fromEntries(brands),
      });
    },
  );
};

const connectWallet = async () => {
  await suggestChain('https://local.agoric.net/network-config');
  const wallet = await makeAgoricWalletConnection(watcher, ENDPOINTS.RPC);
  useAppStore.setState({ wallet });
  const { pursesNotifier } = wallet;
  for await (const purses of subscribeLatest(pursesNotifier)) {
    console.log('got purses', purses);
    useAppStore.setState({ purses });
  }
};

// const watchUpdates = async () => {
//   const { wallet, offerUpInstance, brands } = useAppStore.getState();
//   const iterator = subscribeLatest(wallet?.walletUpdatesNotifier);
//   for await (const update of iterator) {
//     console.log("MUNEEB", update)
//     // numWantsSatisfied can either be 1 or 0 until "multiples" are
//     // supported.
//     //
//     // https://github.com/Agoric/agoric-sdk/blob/1b5e57f17a043a43171621bbe3ef68131954f714/packages/zoe/src/zoeService/types.js#L213
//     if (update.status.numWantsSatisfied > 0) {
//       console.log('Offer accepted', update);
//       return;
//     }
//   }
// };

const makeOffer = async (giveValue: bigint, wantChoice: string, offerType: string, watchUpdates: Function) => {
  const { wallet, offerUpInstance, brands } = useAppStore.getState();
  if (!offerUpInstance) throw Error('no contract instance');
  if (!(brands && brands.IST && brands.Item))
    throw Error('brands not available');

  const choiceBag = makeCopyBag([
    [{ serviceStarted: '123', serviceType: wantChoice }, 1n],
  ]);

  // want: { Items: AmountMath.make(brands.Item, choiceBag) }

  // const value = makeCopyBag(entries(wantChoices));
  const want = { Items: AmountMath.make(brands.Item, choiceBag) };
  const give = { Price: AmountMath.make(brands.IST, 10000000n) };


  wallet?.makeOffer(
    {
      source: 'contract',
      instance: offerUpInstance,
      publicInvitationMaker: 'makeTradeInvitation',
    },
    { give, want },
    {
      userAddress: wallet.address,
      serviceType: wantChoice,
      offerType: offerType,
    },
    (update: { status: string; data?: unknown }) => {
      if (offerType === 'BUY_SUBSCRIPTION') {
      
      if (update.status === 'error') {
        alert(`Offer error: ${update.data}`);
      }
      if (update.status === 'accepted') {
        alert('Offer accepted');
      }
      if (update.status === 'refunded') {
        alert('Offer rejected');
      }
    }
  }
  );
  watchUpdates(wallet, offerType, wantChoice);
};

function App() {
  useEffect(() => {
    setup();
  }, []);

  const { wallet, purses } = useAppStore(({ wallet, purses }) => ({
    wallet,
    purses,
  }));
  const istPurse = purses?.find(p => p.brandPetname === 'IST');
  const itemsPurse = purses?.find(p => p.brandPetname === 'Item');

  const tryConnectWallet = () => {
    connectWallet().catch(err => {
      switch (err.message) {
        case 'KEPLR_CONNECTION_ERROR_NO_SMART_WALLET':
          alert('no smart wallet at that address');
          break;
        default:
          alert(err.message);
      }
    });
  };

  return (
    <>
      <Logos />
      <h1>All-in-One Subscription Service</h1>

      <div className="card">
        <Subscribe
          makeOffer={makeOffer}
          istPurse={istPurse as Purse}
          walletConnected={!!wallet}
        />
        <hr />
        {wallet && istPurse ? (
          <Inventory
            address={wallet.address}
            istPurse={istPurse}
            itemsPurse={itemsPurse as Purse}
            
          />
        ) : (
          <button onClick={tryConnectWallet}>Connect Wallet</button>
        )}
      </div>
    </>
  );
}

export default App;
