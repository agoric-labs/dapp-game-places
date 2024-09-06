/**
 * @file Contract to mint and sell a few Item NFTs at a time.
 *
 * We declare variables (including functions) before using them,
 * so you may want to skip ahead and come back to some details.
 * @see {start} for the main contract entrypoint
 *
 * As is typical in Zoe contracts, the flow is:
 *   1. contract does internal setup and returns public / creator facets.
 *   2. client uses a public facet method -- {@link makeTradeInvitation} in this case --
 *      to make an invitation.
 *   3. client makes an offer using the invitation, along with
 *      a proposal (with give and want) and payments. Zoe escrows the payments, and then
 *   4. Zoe invokes the offer handler specified in step 2 -- here {@link tradeHandler}.
 *
 * @see {@link https://docs.agoric.com/guides/zoe/|Zoe Overview} for a walk-thru of this contract
 * @see {@link https://docs.agoric.com/guides/js-programming/hardened-js.html|Hardened JavaScript}
 * for background on `harden` and `assert`.
 */
// @ts-check

import { Far, E } from '@endo/far';
import { AmountMath, AssetKind } from '@agoric/ertp/src/amountMath.js';
import { makeCopyBag, M } from '@endo/patterns';
import { atomicRearrange } from '@agoric/zoe/src/contractSupport/atomicTransfer.js';
import '@agoric/zoe/exported.js';

/**
 * In addition to the standard `issuers` and `brands` terms,
 * this contract is parameterized by terms for price and,
 * optionally, a maximum number of items sold for that price (default: 3).
 *
 * @typedef {{
 *   subscriptionPrice: Amount;
 *   subscriptionPeriod?: string;
 *   servicesToAvail?: Array<string>;
 * }} SubscriptionServiceTerms
 */

/**
 * Start a contract that
 *   - creates a new non-fungible asset type for Items, and
 *   - handles offers to buy up to `maxItems` items at a time.
 *
 * @param {ZCF<SubscriptionServiceTerms>} zcf
 */
export const start = async zcf => {
  const {
    // timerService,
    subscriptionPrice,
    subscriptionPeriod = 'MONTHLY',
    servicesToAvail = ['Netflix', 'Amazon', 'HboMax', 'Disney'],
  } = zcf.getTerms();

  const subscriptionResources = {};

  servicesToAvail.forEach(element => {
    subscriptionResources[element] = [
      `${element}_Movie_1`,
      `${element}_Movie_2`,
    ];
  });

  /**
   * a new ERTP mint for items, accessed thru the Zoe Contract Facet.
   * Note: `makeZCFMint` makes the associated brand and issuer available
   * in the contract's terms.
   *
   * AssetKind.COPY_BAG can express non-fungible (or rather: semi-fungible)
   * amounts such as: 3 potions and 1 map.
   */
  const itemMint = await zcf.makeZCFMint('Item', AssetKind.COPY_BAG);

  const { brand } = itemMint.getIssuerRecord();

  /**
   * a pattern to constrain proposals given to {@link tradeHandler}
   *
   * The `Price` amount must be >= `tradePrice` term.
   * The `Items` amount must use the `Item` brand and a bag value.
   */
  const proposalShape = harden({
    give: { Price: M.eq(subscriptionPrice) },
    want: { Items: { brand: M.any(), value: M.bag() } },
    exit: M.any(),
  });

  /** a seat for allocating proceeds of sales */
  const proceeds = zcf.makeEmptySeatKit().zcfSeat;

  const subscriptions = new Map();

  /** @type {OfferHandler} */
  const tradeHandler = (buyerSeat, offerArgs) => {
    // @ts-ignore
    const { userAddress, serviceType, offerType }  = offerArgs;
    // const currentTimeRecord = await E(timerService).getCurrentTimestamp();

    if (offerType === 'BUY_SUBSCRIPTION') {
      const amountObject = AmountMath.make(
        brand,
        makeCopyBag([[{ serviceStarted: '123', serviceType }, 1n]]),
      );
      const want = { Items: amountObject };
  
      const newSubscription = itemMint.mintGains(want);
  
      atomicRearrange(
        zcf,
        harden([
          // price from buyer to proceeds
          [buyerSeat, proceeds, { Price: subscriptionPrice }],
          // new items to buyer
          [newSubscription, buyerSeat, want],
        ]),
      );
  
      const subscriptionKey = `${userAddress}_${serviceType}`;
      subscriptions.set(subscriptionKey, want.Items);
  
      
      buyerSeat.exit(true);
      newSubscription.exit();
      return 'Subscription Granted';
      
    }
    else if (offerType === 'VIEW_SUBSCRIPTION') {
      buyerSeat.exit();
      return getSubscriptionResources(userAddress, serviceType);
    }

    
  };

  /**
   * Make an invitation to trade for items.
   *
   * Proposal Keywords used in offers using these invitations:
   *   - give: `Price`
   *   - want: `Items`
   */
  const makeTradeInvitation = () =>
    zcf.makeInvitation(
      tradeHandler,
      'buy subscription',
      undefined,
      proposalShape,
    );

  const isSubscriptionValid = userSubscription => {
    if (!userSubscription || !userSubscription.value.payload) return false;

    const serviceStarted = userSubscription.value.payload[0][0].serviceStarted;

    // Here we'll check with current time from time service.
    if (!serviceStarted || serviceStarted !== '123') return false;
    return true;
    //
  };

  const getSubscriptionResources = (userAddress, serviceType) => {
    const subscriptionKey = `${userAddress}_${serviceType}`;
    const userSubscription = subscriptions.get(subscriptionKey);

    const isValidSub = isSubscriptionValid(userSubscription);
    if (isValidSub) {
      // User has a valid subscription, return the resources
      const serviceType = userSubscription.value.payload[0][0].serviceType;
      return JSON.stringify(subscriptionResources[serviceType]);
    } else {
      // User doesn't have a valid subscription
      return 'Access denied: You do not have a valid subscription.';
    }
  };

  // Mark the publicFacet Far, i.e. reachable from outside the contract
  const publicFacet = Far('Items Public Facet', {
    makeTradeInvitation,
    getSubscriptionResources,
  });
  return harden({ publicFacet });
};
harden(start);
