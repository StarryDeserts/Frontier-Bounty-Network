# Testnet Claim Route B Deployment Record

Date: 2026-03-27
Network: Sui testnet
Status: canonical live deployment for this repository
Active address used for verification: `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`

## Canonical deployment values

- `PACKAGE_ID=0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd`
- `PUBLISH_TX=7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz`
- `BOUNTY_BOARD_ID=0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6`
- `CLAIM_REGISTRY_ID=0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671`
- `KILL_PROOF_ISSUER_CAP_ID=0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539`
- `UPGRADE_CAP_ID=0xe38143018a24fc406af6cc0e22b65ba2940d5754ab19acd9487d0267bfde4385`
- `CLOCK_ID=0x6`

## Superseded package

The previous package is no longer the default live deployment:
- `PACKAGE_ID=0x589e0cabc806514d8320beafb2108caef427527429ecaadb410842e2c838a0dc`

Use it only as historical verification/demo data. Frontend, indexer, root env, and deployment docs now default to the Route B package above.

## Publish and verification tx digests

- Publish: `7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz`
- `register_hunter`: `5fjso2PHzHa9JnT75fG2GL6FHkuiKxnN5W4mBAhtGtFk`
- `split-coin`: `9D5sAzPiWgSo8TffRdwijPnq4qwJvJnuuVzzBwHMeUAy`
- `create_bounty`: `4UhuVaEjvvax9rQLcsxzBHfzFBuJ29sF4QM92NF1Eq8q`
- `issue_kill_proof`: `7i9YWuU1Eg1puh5y1GWTUw7Yu53DRXaDQC12RLQNNBey`

## Relevant created objects from verification

- Hunter badge: `0x32c3f4cc1bc7af88f977db58ee2e72a6d45b1137d5f283b2485388a4fd669cad`
- Live bounty: `0x8445a915be7e0a84c2501710a698f569ad212f8587171d63ed1dd9faaa3c9d6c`
- Payment coin used for create: `0x8e941c5768b59fa3188d5e658561ea5edfc7cd859f023a7f5346b37ef8af526c`
- Issued kill proof: `0x480bcf07d428244bac472bcfe02b2a0796b1a466c9aa3ad52a351f54e3e851a3`

## Discovery commands

```powershell
sui client object `
0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd `
--json

sui client tx-block `
7eZyfo5vNteQ7uKToqU6Cm4tZ2ctpSH7TyacsgSmHsSz `
--json

sui client object `
0x6 `
--json
```

## Verified write commands

### register_hunter

```powershell
sui client call `
--package 0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd `
--module bounty_registry `
--function register_hunter `
--gas-budget 50000000 `
--json
```

### split coin for bounty funding

```powershell
sui client split-coin `
--coin-id 0xac319653fd254e8bc0f35c9211fb509979f0cb007d25e0d97f1ab9ddac62f549 `
--amounts 50000000 `
--gas 0x4c3b0cd0f7dc720fa7326cd4e81630ce606984c54f6c46182eff2ba83e99a5b5 `
--gas-budget 50000000 `
--json
```

### create_bounty

```powershell
sui client call `
--package 0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd `
--module bounty_registry `
--function create_bounty `
--args 0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6 0x8e941c5768b59fa3188d5e658561ea5edfc7cd859f023a7f5346b37ef8af526c 0x0000000000000000000000000000000000000000000000000000000000000b0b 24 '[76,105,118,101,32,98,111,117,110,116,121]' 0x6 `
--gas 0x4c3b0cd0f7dc720fa7326cd4e81630ce606984c54f6c46182eff2ba83e99a5b5 `
--gas-budget 100000000 `
--json
```

### issue_kill_proof

```powershell
sui client call `
--package 0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd `
--module bounty_verify `
--function issue_kill_proof `
--args 0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539 0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5 0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5 0x0000000000000000000000000000000000000000000000000000000000000b0b 1760000000000 300001 '[17,34,51,68,85,102,119,136,153,170,187,204,221,238,255,0]' `
--gas-budget 100000000 `
--json
```

## Live validation summary

Validated on the Route B package:
- `register_hunter` is live
- `create_bounty` is live
- `issue_kill_proof` is live for the cap holder
- indexer live polling and API reads work against the new package
- `POST /api/claim-proof/resolve` returns a manual issuance plan

Current claim classification:
- `live-ready but awaiting external provider`

Meaning:
- the chain-side proof boundary now exists in production
- the repository can prepare issuance inputs and operator commands
- the real external kill-record provider is still not wired, so automated live claim remains pending
