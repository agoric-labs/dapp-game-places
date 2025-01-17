#!/bin/bash
set -xueo pipefail

cd /ws-offerup/contract

SCRIPT=start-offer-up.js
PERMIT=start-offer-up-permit.json
ls -sh "$SCRIPT" "$PERMIT"

PROPOSAL=$(agd query gov proposals --output json | jq -c '.proposals | length | .+1')

make fund-acct

agd tx gov submit-proposal swingset-core-eval "$PERMIT" "$SCRIPT" \
  --title="Start Offer Up Contract" --description="Evaluate $SCRIPT" \
  --deposit=10000000ubld --gas=auto --gas-adjustment=1.2 \
  --from user1 --chain-id agoriclocal --keyring-backend=test \
  --yes -b block

set +x # not so noisy for this part
. /usr/src/upgrade-test-scripts/env_setup.sh
voteLatestProposalAndWait

# Give the core-eval script a block or two to run.
waitForBlock 2

parseInstances() {
  # extract latest value; parse smallCaps; yield 1 line per entry
  jq -c '.value | fromjson | .values[-1] | fromjson | .body[1:] | fromjson | .[]'
}

# check that the contract was actually started
api=http://localhost:1317
curl $api/agoric/vstorage/data/published.agoricNames.instance \
  | parseInstances | grep offerUp
