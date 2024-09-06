import { FormEvent, useEffect, useState } from 'react';
import { stringifyAmountValue } from '@agoric/ui-components';
import scrollIcon from '../assets/scroll.png';
import istIcon from '../assets/IST.svg';
import mapIcon from '../assets/map.png';
import potionIcon from '../assets/potionBlue.png';
import netflixLogo from '../assets/netflix.svg';
import disneyLogo from '../assets/disney.svg';
import hboLogo from '../assets/hbomax.svg';
import primeLogo from '../assets/amazon.svg';
import { Wallet } from '../App';
import { subscribeLatest } from '@agoric/notifier';

const { entries, values } = Object;
const sum = (xs: bigint[]) => xs.reduce((acc, next) => acc + next, 0n);

const terms = {
  price: 10000000n,
};
const nameToIcon = {
  scroll: scrollIcon,
  map: mapIcon,
  potion: potionIcon,
} as const;
type ItemName = keyof typeof nameToIcon;
type ItemChoices = Partial<Record<ItemName, bigint>>;

const parseValue = (numeral: string, purse: Purse): bigint => {
  const { decimalPlaces } = purse.displayInfo;
  const num = Number(numeral) * 10 ** decimalPlaces;
  return BigInt(num);
};

const SERVICES = {
  NETFLIX: 'Netflix',
  AMAZON: 'Amazon',
  HBO: 'HboMax',
  DISNEY: 'Disney',
};

const serviceNameToIconMap = {
  [SERVICES.NETFLIX]: netflixLogo,
  [SERVICES.AMAZON]: primeLogo,
  [SERVICES.DISNEY]: disneyLogo,
  [SERVICES.HBO]: hboLogo,
};

const Item = ({
  icon,
  coinIcon,
  label,
  value,
  onChange,
  inputClassName,
  inputStep,
}: {
  icon?: string;
  coinIcon?: string;
  label: string;
  value: number | string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  inputClassName: string;
  inputStep?: string;
}) => (
  <div className="item-col">
    <label htmlFor={label}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </label>
    {icon && <img className="piece" src={icon} title={label} />}
    {coinIcon && <img className="coin" src={coinIcon} title={label} />}
    <input
      title={label}
      type="number"
      min="0"
      max="3"
      value={value}
      step={inputStep || '1'}
      onChange={onChange}
      className={`trade-input ${inputClassName}`}
    />
  </div>
);

type SubscriptionProps = {
  makeOffer: (giveValue: bigint, wantChoice: string, offerType: string, watchUpdates: Function) => void;
  istPurse: Purse;
  walletConnected: boolean;
};

const watchUpdates = async (wallet: Wallet, offerType: string, serviceType: string) => {
  const iterator = subscribeLatest(wallet?.walletUpdatesNotifier);
  let flag = false;
  for await (const update of iterator) {
    if (offerType === "VIEW_SUBSCRIPTION" && !flag && update.status.offerArgs.serviceType === serviceType && update.status.offerArgs.offerType === 'VIEW_SUBSCRIPTION') {
      flag = true;
      alert(update.status.result);
  }
  }
};

// TODO: IST displayInfo is available in vbankAsset or boardAux
const Subscribe = ({
  makeOffer,
  istPurse,
  walletConnected,
}: SubscriptionProps) => {
  const [choice, setChoice] = useState<string>('');
  const [selectClass, setSelectClass] = useState<object>({
    [SERVICES.NETFLIX]: '',
    [SERVICES.AMAZON]: '',
    [SERVICES.DISNEY]: '',
    [SERVICES.HBO]: '',
  });

  
  return (
    <>
      <div className="trade">
        <h3>Pick a Provider</h3>
        <div className="row-center">
          <div className="item-col row-center">
            {Object.entries(SERVICES).map(([_, service]) => {
              return (
                <div
                  key={service}
                  style={{ padding: '12px', cursor: 'pointer' }}
                  onClick={() => {
                    setChoice(service);
                    setSelectClass({
                      [SERVICES.NETFLIX]: '',
                      [SERVICES.AMAZON]: '',
                      [SERVICES.DISNEY]: '',
                      [SERVICES.HBO]: '',
                      [service]: 'selected',
                    });
                  }}
                  // className={selectClass[service]}
                >
                  <div
                    style={{
                      backgroundColor: 'grey',
                      borderRadius: '5px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingBottom: '5px',
                    }}
                    className={`${selectClass[service]} item-col`}
                  >
                    <img
                      src={serviceNameToIconMap[service]}
                      className="service"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ fontStyle: 'italic' }}>
          *Subscribe to any service for 10 IST
        </div>
      </div>

      <div>
        {walletConnected && (
          <button onClick={() => {
            makeOffer(terms.price, choice, "BUY_SUBSCRIPTION", () => {})
            }}>
            Subscribe
          </button>
        )}
        {walletConnected && (
          <button onClick={() => {
            makeOffer(terms.price, choice, "VIEW_SUBSCRIPTION", watchUpdates)
            }}>
            View Subscription
          </button>
        )}
      </div>
    </>
  );
};

export { Subscribe };
