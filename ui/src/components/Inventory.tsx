import { ConnectWalletButton, useAgoric } from '@agoric/react-components';
import { stringifyAmountValue } from '@agoric/ui-components';
import { usePurse } from '../hooks/usePurse';
import type { CopyBag } from '../types';

const Inventory = () => {
  const istPurse = usePurse('IST');
  const itemsPurse = usePurse('Item');
  const { walletConnection } = useAgoric();

  return (
    <div className="card">
      <h3>My Wallet</h3>
      <div>
        <ConnectWalletButton />
        {walletConnection && (
          <div style={{ textAlign: 'left' }}>
            <div>
              <b>IST: </b>
              {istPurse ? (
                stringifyAmountValue(
                  istPurse.currentAmount,
                  istPurse.displayInfo.assetKind,
                  istPurse.displayInfo.decimalPlaces,
                )
              ) : (
                <i>Fetching balance...</i>
              )}
            </div>
            <div>
              <b>Items: </b>
              {itemsPurse ? (
                <ul style={{ marginTop: 0, textAlign: 'left' }}>
                  {(itemsPurse.currentAmount.value as CopyBag).payload.map(
                    ([name, number]) => (
                      <li key={name}>
                        {String(number)} {name}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                'None'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Inventory };
