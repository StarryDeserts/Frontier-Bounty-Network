# 3-Minute Demo Script

## 0:00-0:20 Opening

Hi, this is Frontier Bounty Network.
It is an EVE Frontier bounty infrastructure dApp built on Sui.
The key idea is simple: instead of treating bounties as just a reward board, we treat them as policy input for Smart Infrastructure.

## 0:20-0:55 Problem

In EVE Frontier, player-owned infrastructure should be programmable.
But bounty systems usually stop at, "here is a wanted target and here is a reward."
What they do not do is affect how infrastructure behaves.

Our thesis is that wanted-player state should be usable by Smart Gates, Smart Turrets, and other player-run systems.
That creates deterrence, access control, and new security services for the game world.

## 0:55-1:15 What we built

So we focused on one narrow, convincing slice:
Wanted players trigger Smart Gate policy.

Today, players can publish live bounties on Sui testnet.
Then the frontend turns that wanted state into a Smart Gate policy surface with three modes:
BLOCK, SURCHARGE, and ALERT_ONLY.

## 1:15-2:15 Live demo flow

Here on the Smart Gate Demo page, I can see live wanted targets derived from current bounty state.
This frontend is running in chain-direct mode, so it does not require a hosted indexer to work.

I select SURCHARGE, which is the clearest demo mode.
It means a wanted pilot is not automatically blocked, but they do pay a penalty to cross the gate.

Now I connect my wallet and register the Smart Gate policy on-chain.
This transaction is real and goes to the live Sui testnet package.

After that, I can show the transaction digest and explain the expected behavior:
if a pilot is above the wanted threshold, the gate policy would classify them for surcharge.

## 2:15-2:40 What is live versus staged

What is live today:
- hunter registration
- bounty creation
- gate policy registration
- direct chain reads from the frontend

What is still staged:
- the final hookup into the actual Smart Gate runtime inside EVE Frontier
- fully automated claim verification against a real kill-record provider

## 2:40-3:00 Why it matters and next step

Why this matters is that it turns bounties into infrastructure logic.
It is not just "hunt this player."
It is "player-owned infrastructure can respond to wanted status."

The next step is straightforward:
connect this existing policy surface into a real Smart Gate extension or `canJump` hook, and then extend the same pattern to Smart Turrets.
