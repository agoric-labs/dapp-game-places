#!/bin/bash

# Function to check if we see a pattern of block commits
check_block_pattern() {
    local count=0
    local required_patterns=3  # Number of block patterns we want to see

    while IFS= read -r line; do
        echo -n "."  # Show progress

        if [[ $line =~ "block-manager: block "[0-9]+" commit" ]]; then
            ((count++))
            if [ $count -ge $required_patterns ]; then
                echo
                echo "$line"
                return 0  # Success
            fi
        fi
    done

    return 1  # Pattern not found
}

echo "Waiting for blockchain to start..."
yarn docker:logs | check_block_pattern

if [ $? -eq 0 ]; then
    echo "Blockchain is running and producing blocks..."
    exit 0
else
    echo "Failed to detect blockchain activity\n Run yarn start:docker to start the blockchain first!"
    exit 1
fi
