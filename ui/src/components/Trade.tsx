import { FormEvent, useState } from 'react';
import { stringifyAmountValue } from '@agoric/ui-components';
import scrollIcon from '../assets/scroll.png';
import istIcon from '../assets/IST.svg';
import mapIcon from '../assets/map.png';
import potionIcon from '../assets/potionBlue.png';
import { usePurse } from '../hooks/usePurse';
import { AgoricWalletConnection, useAgoric } from '@agoric/react-components';
import { makeCopyBag } from '@agoric/store';
import { useContractStore } from '../store/contract';
import type { Purse } from '../types';

const { entries, values } = Object;
const sum = (xs: bigint[]) => xs.reduce((acc, next) => acc + next, 0n);

const terms = {
  price: 250000n,
  maxItems: 3n,
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

const makeOffer = (
  wallet: AgoricWalletConnection,
  giveValue: bigint,
  wantChoices: Record<string, bigint>,
) => {
  const { instance, brands } = useContractStore.getState();
  if (!instance) throw Error('no contract instance');
  if (!(brands && brands.IST && brands.Item))
    throw Error('brands not available');

  const value = makeCopyBag(entries(wantChoices));
  const want = { Items: { brand: brands.Item, value } };
  const give = { Price: { brand: brands.IST, value: giveValue } };

  wallet?.makeOffer(
    {
      source: 'contract',
      instance,
      publicInvitationMaker: 'makeTradeInvitation',
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

const Trade = () => {
  const istPurse = usePurse('IST');
  const { brands, instance } = useContractStore();
  const [giveValue, setGiveValue] = useState(terms.price);
  const [choices, setChoices] = useState<ItemChoices>({ map: 1n, scroll: 2n });
  const { walletConnection } = useAgoric();

  const changeChoice = (ev: FormEvent) => {
    if (!ev.target) return;
    const elt = ev.target as HTMLInputElement;
    const title = elt.title as ItemName;
    if (!title) return;
    const qty = BigInt(elt.value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [title]: _old, ...rest }: ItemChoices = choices;
    const newChoices = qty > 0 ? { ...rest, [title]: qty } : rest;
    setChoices(newChoices);
  };

  return (
    <>
      <div className="trade">
        <h3>Want: Choose up to 3 items</h3>
        <div className="row-center">
          {entries(nameToIcon).map(([title, icon]) => (
            <Item
              key={title}
              icon={icon}
              value={Number(choices[title as ItemName] || 0n)}
              label={title}
              onChange={changeChoice}
              inputClassName={
                sum(values(choices)) <= terms.maxItems ? 'ok' : 'error'
              }
            />
          ))}
        </div>
      </div>
      <div className="trade">
        <h3>Give: Offer at least 0.25 IST</h3>
        <div className="row-center">
          <Item
            key="IST"
            coinIcon={istIcon}
            value={
              istPurse
                ? stringifyAmountValue(
                    { ...istPurse.currentAmount, value: giveValue },
                    istPurse.displayInfo.assetKind,
                    istPurse.displayInfo.decimalPlaces,
                  )
                : '0.25'
            }
            label="IST"
            onChange={ev =>
              istPurse && setGiveValue(parseValue(ev?.target?.value, istPurse))
            }
            inputClassName={giveValue >= terms.price ? 'ok' : 'error'}
            inputStep="0.01"
          />
        </div>
      </div>
      <div>
        {walletConnection && brands && instance ? (
          <button
            onClick={() => makeOffer(walletConnection, giveValue, choices)}
          >
            Make an Offer
          </button>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export { Trade };
