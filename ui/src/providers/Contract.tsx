import { PropsWithChildren, useEffect } from 'react';
import {
  type ChainStorageWatcher,
  AgoricChainStoragePathKind as Kind,
} from '@agoric/rpc';
import { useAgoric } from '@agoric/react-components';
import { useContractStore } from '../store/contract';

const { fromEntries } = Object;

const watchContract = (watcher: ChainStorageWatcher) => {
  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.instance'],
    instances => {
      console.log('Got instances', instances);
      useContractStore.setState({
        instance: instances.find(([name]) => name === 'offerUp')!.at(1),
      });
    },
  );

  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.brand'],
    brands => {
      console.log('Got brands', brands);
      useContractStore.setState({
        brands: fromEntries(brands),
      });
    },
  );
};

export const ContractProvider = ({ children }: PropsWithChildren) => {
  const { chainStorageWatcher } = useAgoric();
  useEffect(() => {
    if (chainStorageWatcher) {
      watchContract(chainStorageWatcher);
    }
  }, [chainStorageWatcher]);

  return <>{children}</>;
};
