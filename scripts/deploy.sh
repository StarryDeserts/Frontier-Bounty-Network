#!/usr/bin/env bash
set -euo pipefail

cd contracts/frontier_bounty
sui move build
sui move test

echo "Publish with: sui client publish --gas-budget 100000000"
