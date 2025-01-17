#!/bin/bash
set -e  # Exit on error

# Check if script has execute permissions
if [ ! -x "$(pwd)/contract/scripts/run-chain.sh" ]; then
    echo "Adding execute permissions to run-chain.sh..."
    chmod +x "$(pwd)/contract/scripts/run-chain.sh"
fi

# Check if container already exists and is running
if [ "$(docker ps -q -f name=agdc)" ]; then
    echo "Container 'agdc' is already running. Please stop it first using 'docker stop agdc' if you want to start a new instance."
    exit 1
fi

# Check if container exists but is stopped
if [ "$(docker ps -aq -f status=exited -f name=agdc)" ]; then
    echo "Found stopped container 'agdc'. Removing it before starting a new one..."
    docker rm agdc
fi

# Set paths only if environment variables are not already set
: ${DAPP_ED_CERT_PATH:="$(pwd)/../dapp-ed-cert"}
: ${DAPP_CHAIN_TIMER_PATH:="$(pwd)/../dapp-chain-timer"}
: ${SECOND_INVITE_PATH:="$(pwd)/../dapp-second-invite"}
: ${DAPP_OFFER_UP_PATH:="$(pwd)/../dapp-offer-up"}
: ${DAPP_AGORIC_BASICS_PATH:="$(pwd)/../dapp-agoric-basics"}

# Start new container
docker run -d \
  --name agdc \
  --platform linux/amd64 \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -e DEST=1 \
  -e DEBUG="SwingSet:ls,SwingSet:vat" \
  $([ -d "$DAPP_ED_CERT_PATH" ] && echo "-v $DAPP_ED_CERT_PATH:/ws-edcert") \
  $([ -d "$DAPP_CHAIN_TIMER_PATH" ] && echo "-v $DAPP_CHAIN_TIMER_PATH:/ws-chainTimer") \
  $([ -d "$SECOND_INVITE_PATH" ] && echo "-v $SECOND_INVITE_PATH:/ws-secondInvite") \
  $([ -d "$DAPP_OFFER_UP_PATH" ] && echo "-v $DAPP_OFFER_UP_PATH:/ws-offerup") \
  $([ -d "$DAPP_AGORIC_BASICS_PATH" ] && echo "-v $DAPP_AGORIC_BASICS_PATH:/ws-agoricBasics") \
  ghcr.io/agoric/agoric-3-proposals:latest \
  /ws-edcert/contract/scripts/run-chain.sh || {
    echo "Failed to start docker container. Please check if Docker is running and you have necessary permissions."
    exit 1
}

echo "Container 'agdc' started successfully."
