import './installSesLockdown.ts'; // Must be the first
import { useEffect } from 'react';
import { create } from 'zustand';
import './App.css';
import { Inventory } from './components/Inventory';
import { Trade } from './components/Trade';
import { makeCopyBag } from '@agoric/store';
import { Logos } from './components/Logos.tsx';

import {
  Wallet,
  connectWallet,
  getBrands,
  getdappInstance,
} from '../lib/agoric.ts';

const { entries } = Object;

interface AppState {
  wallet?: Wallet;
  offerUpInstance?: unknown;
  brands?: Record<string, unknown>;
  purses?: Array<Purse>;
}

console.log('zustand create', create);
const useAppStore = create<AppState>(() => ({}));

const setup = async () => {
  const offerUpInstance = await getdappInstance('offerUp');
  if (!offerUpInstance) throw Error('no contract instance');
  const brands = await getBrands();
  if (!brands) throw Error('no brands');
  useAppStore.setState({ offerUpInstance, brands });
};

const makeOffer = (giveValue: bigint, wantChoices: Record<string, bigint>) => {
  const { wallet, offerUpInstance, brands } = useAppStore.getState();
  if (!offerUpInstance) throw Error('no contract instance');
  if (!(brands && brands.IST && brands.Item))
    throw Error('brands not available');

  const value = makeCopyBag(entries(wantChoices));
  const want = { Items: { brand: brands.Item, value } };
  const give = { Price: { brand: brands.IST, value: giveValue } };

  wallet?.makeOffer(
    {
      source: 'contract',
      instance: offerUpInstance,
      publicInvitationMaker: 'makeTradeInvitation',
      description: 'buy items',
    },
    { give, want },
    undefined,
    (update: { status: string; data?: unknown }) => {
      if (update.status === 'error') {
        alert(`Offer error: ${update.data}`);
      }
      if (update.status === 'accepted') {
        alert('Offer accepted');
      }
      if (update.status === 'refunded') {
        alert('Offer rejected');
      }
    },
  );
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

  const tryConnectWallet = async () => {
    const { wallet, walletpurses } = await connectWallet();
    console.log('wallet', wallet);
    console.log('walletpurses', walletpurses);
    useAppStore.setState({ wallet, purses: walletpurses });
  };

  return (
    <>
      <Logos />
      <h1>Items Listed on Offer Up</h1>

      <div className="card">
        <Trade
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
