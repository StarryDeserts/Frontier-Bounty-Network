#!/usr/bin/env node
const base = process.env.INDEXER_URL ?? 'http://localhost:3001';

const checks = [
  '/api/bounties',
  '/api/bounties/target/0xb0b',
  '/api/bounties/creator/0xa11ce',
  '/api/hunters/leaderboard',
  '/api/claims/recent',
  '/api/stats',
];

const run = async () => {
  for (const path of checks) {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      throw new Error(`${path} failed: ${res.status}`);
    }
    const json = await res.json();
    const size = Array.isArray(json.data) ? json.data.length : Object.keys(json.data ?? {}).length;
    console.log(`${path} ok (size=${size})`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
