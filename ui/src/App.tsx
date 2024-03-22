import './App.css';
import { Logos } from './components/Logos';
import { Inventory } from './components/Inventory';
import { Trade } from './components/Trade';
import { ContractProvider } from './providers/Contract';
import { AgoricProvider } from '@agoric/react-components';
import { wallets } from 'cosmos-kit';
import '@agoric/react-components/dist/style.css';

const App = () => {
  return (
    <AgoricProvider
      wallets={wallets.extension}
      defaultNetworkConfig={{
        testChain: {
          chainId: 'agoriclocal',
          chainName: 'agoric-local',
        },
        apis: {
          rest: ['http://localhost:1317'],
          rpc: ['http://localhost:26657'],
        },
      }}
    >
      <ContractProvider>
        <Logos />
        <h1>Items Listed on Offer Up</h1>
        <div className="card">
          <Trade />
          <hr />
          <Inventory />
        </div>
      </ContractProvider>
    </AgoricProvider>
  );
};

export default App;
