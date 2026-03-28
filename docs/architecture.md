# Frontier Bounty Network — 完整架构设计文档

> EVE Frontier × Sui Hackathon 2026 | 链上赏金猎人网络

---

## MVP Implementation Alignment (2026-03-27)

This repository uses this section as the acceptance baseline for release hardening:

- Frontend wallet kit package is `@mysten/dapp-kit` (not `@mysten/dapp-kit-react`).
- Indexer runtime default is SQLite (`node:sqlite`) for local zero-service startup.
- PostgreSQL and Redis stay as optional adapters/boundaries for future scaling.
- Claim accounting is sourced from `BountyVerifiedEvent` in indexer processors.
- Live indexer ingestion currently uses HTTP `queryEvents` polling because public testnet websocket subscribe returned HTTP `405` during acceptance.
- Indexer polling state is persisted in SQLite via `event_checkpoints` and `processed_chain_events`.
- Production claim issuance now uses `KillProofIssuerCap` plus `bounty_verify::issue_kill_proof`.
- `KillProofIssuerCap` is currently a temporary centralized trust point held by the package publisher.
- Claim status is `live-ready but awaiting external provider`, not fully live.
- `GET /api/events/recent` exists for demo/live-feed bootstrap, but is treated as a non-contract API surface.
- Mock mode is first-class for local demos (`USE_MOCK_EVENTS=true`, mock events in `indexer/src/mock/mock-events.ts`).
- Frontend reads are now dual-path: `indexer` when healthy, `chain-direct` when the indexer is unavailable or intentionally omitted.
- A static-hosted frontend with `VITE_DATA_MODE=chain-direct` is now a supported deployment path for judge-facing demos.

For full rationale, see `docs/implementation-notes.md`.

---

## 目录

- [1. 系统总览](#1-系统总览)
- [2. 链上合约层（Move on Sui）](#2-链上合约层move-on-sui)
- [3. 索引与数据层](#3-索引与数据层)
- [4. 前端 dApp 层](#4-前端-dapp-层)
- [5. 跨层数据流](#5-跨层数据流)
- [6. 安全设计](#6-安全设计)
- [7. 目录结构](#7-目录结构)
- [8. 部署架构](#8-部署架构)

---

## 1. 系统总览

### 1.1 三层架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Layer 3: Frontend dApp                          │
│                                                                        │
│  React 18 + TypeScript + @mysten/dapp-kit + TanStack Query       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Bounty   │ │  Hunter  │ │  Publish │ │  My      │ │  Admin   │    │
│  │  Board    │ │  Ranking │ │  Bounty  │ │  Profile │ │  Panel   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                        ↕ useSignAndExecuteTransaction                  │
│                        ↕ useSuiClientQuery                             │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────────────┐
│                    Layer 2: Indexing & Data Layer                       │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  Sui GraphQL     │  │  Event           │  │  EVE Frontier       │   │
│  │  (Object Query)  │  │  Subscription    │  │  API (Kill Records) │   │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘   │
│           │                    │                       │               │
│  ┌────────▼────────────────────▼───────────────────────▼──────────┐   │
│  │                     Custom Indexer (Optional)                   │   │
│  │        SQLite default; Postgres + Redis optional            │   │
│  └────────────────────────────────────────────────────────────────┘   │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────────────┐
│                  Layer 1: On-Chain Contracts (Move on Sui)              │
│                                                                        │
│  Package: frontier_bounty                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│  │ bounty_       │ │ bounty_       │ │ bounty_       │                  │
│  │ registry      │ │ escrow        │ │ verify        │                  │
│  │ .move         │ │ .move         │ │ .move         │                  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                  │
│         │                │                │                            │
│  ┌──────▼───────┐ ┌──────▼───────┐                                   │
│  │ turret_       │ │ gate_         │                                   │
│  │ bounty        │ │ bounty        │                                   │
│  │ .move         │ │ .move         │                                   │
│  └──────────────┘ └──────────────┘                                   │
│                                                                        │
│  Shared Objects: BountyBoard (全局注册表)                              │
│  Owned Objects:  Bounty, HunterBadge                                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

| 原则 | 说明 |
|------|------|
| **对象优先** | 利用 Sui 对象模型，每个赏金是独立 Object，而非 Table 中的行 |
| **最小化共享对象** | 仅 `BountyBoard`（全局注册表）为 Shared Object，降低并发瓶颈 |
| **事件驱动** | 所有状态变更通过 `event::emit` 通知前端，支持实时 UI 更新 |
| **模块解耦** | 5 个 Move 模块各自职责清晰，可独立测试和升级 |
| **Move 资源安全** | 利用线性类型确保代币不丢失、不重复，防止重入攻击 |

---

## 2. 链上合约层（Move on Sui）

### 2.1 Package 结构

```
frontier_bounty/
├── Move.toml                  # 包配置
├── sources/
│   ├── bounty_registry.move   # 模块1: 赏金注册表 & 全局状态
│   ├── bounty_escrow.move     # 模块2: 代币托管 & 资金管理
│   ├── bounty_verify.move     # 模块3: 击杀验证 & 赏金领取
│   ├── turret_bounty.move     # 模块4: 炮塔攻击扩展
│   └── gate_bounty.move       # 模块5: 星门管制扩展
└── tests/
    ├── bounty_registry_tests.move
    ├── bounty_escrow_tests.move
    └── bounty_verify_tests.move
```

`Move.toml`:
```toml
[package]
name = "frontier_bounty"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
frontier_bounty = "0x0"
```

---

### 2.2 模块 1: bounty_registry.move — 赏金注册表

> 职责：管理全局赏金列表、创建/取消赏金、维护赏金状态机

#### 核心数据结构

```move
module frontier_bounty::bounty_registry;

use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::clock::{Self, Clock};
use sui::event;
use sui::table::{Self, Table};
use sui::coin::{Self, Coin};
use sui::sui::SUI;

// ============================================================
//                        ERROR CODES
// ============================================================
const E_NOT_BOUNTY_CREATOR: u64 = 0;
const E_BOUNTY_EXPIRED: u64 = 1;
const E_BOUNTY_NOT_ACTIVE: u64 = 2;
const E_INVALID_REWARD: u64 = 3;
const E_SELF_BOUNTY: u64 = 4;
const E_BOUNTY_STILL_ACTIVE: u64 = 5;
const E_MIN_REWARD: u64 = 6;

const MIN_REWARD_AMOUNT: u64 = 1_000_000; // 0.001 SUI (单位 MIST)

// ============================================================
//                     BOUNTY STATUS ENUM
// ============================================================
const STATUS_ACTIVE: u8 = 0;
const STATUS_CLAIMED: u8 = 1;
const STATUS_CANCELLED: u8 = 2;
const STATUS_EXPIRED: u8 = 3;

// ============================================================
//                      CORE OBJECTS
// ============================================================

/// 全局赏金面板 — Shared Object
/// 这是唯一的 Shared Object，所有赏金的注册和索引都通过它进行
public struct BountyBoard has key {
    id: UID,
    /// 活跃赏金计数
    active_count: u64,
    /// 历史总赏金数
    total_bounties_created: u64,
    /// 历史总发放金额 (MIST)
    total_rewards_paid: u64,
    /// target_address -> vector<ID> 映射，快速查找某人身上的赏金
    target_index: Table<address, vector<ID>>,
}

/// 赏金对象 — Owned Object (归属于合约/BountyBoard)
/// 每个赏金是一个独立的 Sui Object，拥有唯一 ID
public struct Bounty has key, store {
    id: UID,
    /// 赏金发布者地址
    creator: address,
    /// 悬赏目标地址 (被通缉的玩家)
    target: address,
    /// 赏金金额 (MIST)
    reward_amount: u64,
    /// 赏金状态: 0=Active, 1=Claimed, 2=Cancelled, 3=Expired
    status: u8,
    /// 创建时间戳 (毫秒)
    created_at: u64,
    /// 到期时间戳 (毫秒)
    expires_at: u64,
    /// 赏金描述 / 悬赏理由 (可选, UTF-8, 最长 256 字节)
    description: vector<u8>,
    /// 猎人地址 (仅当 status=Claimed 时有值)
    claimed_by: Option<address>,
}

/// 猎人身份徽章 — Owned Object (归属于猎人玩家)
/// 追踪猎人的历史战绩，类似 SBT (Soulbound Token)
public struct HunterBadge has key, store {
    id: UID,
    /// 猎人地址
    hunter: address,
    /// 成功击杀次数
    kills: u64,
    /// 累计获得赏金 (MIST)
    total_earnings: u64,
    /// 连续击杀（连杀）
    streak: u64,
    /// 最高连杀记录
    max_streak: u64,
}

// ============================================================
//                        EVENTS
// ============================================================

/// 赏金创建事件
public struct BountyCreatedEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    target: address,
    reward_amount: u64,
    expires_at: u64,
}

/// 赏金被领取事件
public struct BountyClaimedEvent has copy, drop {
    bounty_id: ID,
    target: address,
    hunter: address,
    reward_amount: u64,
}

/// 赏金取消事件
public struct BountyCancelledEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    refund_amount: u64,
}

/// 赏金过期事件
public struct BountyExpiredEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    refund_amount: u64,
}

// ============================================================
//                   INITIALIZATION
// ============================================================

/// 模块初始化：创建全局 BountyBoard (Shared Object)
fun init(ctx: &mut TxContext) {
    let board = BountyBoard {
        id: object::new(ctx),
        active_count: 0,
        total_bounties_created: 0,
        total_rewards_paid: 0,
        target_index: table::new(ctx),
    };
    // 共享 BountyBoard，所有人可读写
    transfer::share_object(board);
}

// ============================================================
//                   PUBLIC FUNCTIONS
// ============================================================

/// 创建赏金
/// - 发布者锁定 SUI 代币作为赏金
/// - 自动设定到期时间
/// - 不允许悬赏自己
public entry fun create_bounty(
    board: &mut BountyBoard,
    payment: Coin<SUI>,
    target: address,
    duration_hours: u64,
    description: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let creator = tx_context::sender(ctx);
    let reward_amount = coin::value(&payment);

    // 验证
    assert!(reward_amount >= MIN_REWARD_AMOUNT, E_MIN_REWARD);
    assert!(creator != target, E_SELF_BOUNTY);

    let now = clock::timestamp_ms(clock);
    let expires_at = now + (duration_hours * 3600 * 1000);

    let bounty = Bounty {
        id: object::new(ctx),
        creator,
        target,
        reward_amount,
        status: STATUS_ACTIVE,
        created_at: now,
        expires_at,
        description,
        claimed_by: option::none(),
    };

    let bounty_id = object::id(&bounty);

    // 更新 BountyBoard 索引
    if (!table::contains(&board.target_index, target)) {
        table::add(&mut board.target_index, target, vector::empty<ID>());
    };
    let target_bounties = table::borrow_mut(&mut board.target_index, target);
    vector::push_back(target_bounties, bounty_id);

    board.active_count = board.active_count + 1;
    board.total_bounties_created = board.total_bounties_created + 1;

    // 发射事件
    event::emit(BountyCreatedEvent {
        bounty_id,
        creator,
        target,
        reward_amount,
        expires_at,
    });

    // 将赏金代币转入 escrow（通过 bounty_escrow 模块）
    // 这里先将 payment 和 bounty 打包，由 escrow 模块处理
    frontier_bounty::bounty_escrow::deposit(bounty, payment, ctx);
}

/// 取消赏金（仅创建者可取消，仅在 Active 状态）
public entry fun cancel_bounty(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(sender == bounty.creator, E_NOT_BOUNTY_CREATOR);
    assert!(bounty.status == STATUS_ACTIVE, E_BOUNTY_NOT_ACTIVE);

    bounty.status = STATUS_CANCELLED;
    board.active_count = board.active_count - 1;

    event::emit(BountyCancelledEvent {
        bounty_id: object::id(bounty),
        creator: bounty.creator,
        refund_amount: bounty.reward_amount,
    });

    // 通过 escrow 模块退还资金
    frontier_bounty::bounty_escrow::refund(bounty, ctx);
}

/// 注册成为猎人（创建 HunterBadge）
public entry fun register_hunter(ctx: &mut TxContext) {
    let hunter = tx_context::sender(ctx);
    let badge = HunterBadge {
        id: object::new(ctx),
        hunter,
        kills: 0,
        total_earnings: 0,
        streak: 0,
        max_streak: 0,
    };
    transfer::transfer(badge, hunter);
}

// ============================================================
//                   VIEW FUNCTIONS
// ============================================================

/// 检查某地址是否被悬赏
public fun is_wanted(board: &BountyBoard, target: address): bool {
    table::contains(&board.target_index, target)
}

/// 获取某目标的活跃赏金 ID 列表
public fun get_bounties_for_target(
    board: &BountyBoard,
    target: address,
): &vector<ID> {
    table::borrow(&board.target_index, target)
}

/// 获取赏金状态
public fun bounty_status(bounty: &Bounty): u8 { bounty.status }

/// 获取赏金目标
public fun bounty_target(bounty: &Bounty): address { bounty.target }

/// 获取赏金金额
public fun bounty_reward(bounty: &Bounty): u64 { bounty.reward_amount }

/// 检查赏金是否过期
public fun is_expired(bounty: &Bounty, clock: &Clock): bool {
    clock::timestamp_ms(clock) > bounty.expires_at
}
```

#### 对象所有权设计

```
BountyBoard (Shared Object)
├── target_index: Table<address, vector<ID>>   ← 按目标索引赏金
├── active_count: u64
└── total_bounties_created: u64

Bounty (Dynamic Field of BountyBoard, 或 Owned by escrow)
├── creator: address
├── target: address
├── reward_amount: u64
├── status: u8
└── expires_at: u64

HunterBadge (Owned by hunter player)
├── kills: u64
├── total_earnings: u64
└── streak: u64
```

---

### 2.3 模块 2: bounty_escrow.move — 代币托管

> 职责：安全管理赏金资金的锁定、释放和退还

#### 核心数据结构

```move
module frontier_bounty::bounty_escrow;

use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::event;
use sui::dynamic_object_field as dof;

// ============================================================
//                        ERROR CODES
// ============================================================
const E_INSUFFICIENT_BALANCE: u64 = 100;
const E_ALREADY_WITHDRAWN: u64 = 101;
const E_UNAUTHORIZED: u64 = 102;

// ============================================================
//                      CORE OBJECTS
// ============================================================

/// 赏金金库 — 一个赏金对应一个金库
/// 使用 Dynamic Object Field 将金库附加到 Bounty 对象上
public struct EscrowVaultKey has copy, drop, store {}

/// 金库对象：持有锁定的 SUI 代币
public struct EscrowVault has key, store {
    id: UID,
    /// 关联的赏金 ID
    bounty_id: ID,
    /// 锁定的 SUI 余额
    balance: Balance<SUI>,
    /// 发布者地址（用于退款验证）
    depositor: address,
}

// ============================================================
//                        EVENTS
// ============================================================

public struct FundsDepositedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    depositor: address,
}

public struct FundsReleasedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    recipient: address,
}

public struct FundsRefundedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    refunded_to: address,
}

// ============================================================
//                   CORE FUNCTIONS
// ============================================================

/// 存入赏金资金
/// 将 Coin<SUI> 转换为 Balance 并锁定在 EscrowVault 中
/// EscrowVault 通过 Dynamic Object Field 附加到 Bounty 上
public fun deposit(
    bounty: &mut Bounty,       // from bounty_registry
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let depositor = tx_context::sender(ctx);
    let amount = coin::value(&payment);
    let bounty_id = object::id(bounty);

    let vault = EscrowVault {
        id: object::new(ctx),
        bounty_id,
        balance: coin::into_balance(payment),
        depositor,
    };

    // 将 vault 作为 Dynamic Object Field 附加到 bounty
    dof::add(&mut bounty.id, EscrowVaultKey {}, vault);

    event::emit(FundsDepositedEvent {
        bounty_id,
        amount,
        depositor,
    });
}

/// 释放赏金给猎人
/// 仅由 bounty_verify 模块在验证击杀后调用
public(package) fun release_to_hunter(
    bounty: &mut Bounty,
    hunter: address,
    ctx: &mut TxContext,
): Coin<SUI> {
    let vault: EscrowVault = dof::remove(&mut bounty.id, EscrowVaultKey {});
    let bounty_id = vault.bounty_id;
    let amount = balance::value(&vault.balance);

    // 将 Balance 转换为 Coin 并转给猎人
    let reward_coin = coin::from_balance(vault.balance, ctx);

    // 销毁空的 vault 对象
    let EscrowVault { id, bounty_id: _, balance: _, depositor: _ } = vault;
    object::delete(id);

    event::emit(FundsReleasedEvent {
        bounty_id,
        amount,
        recipient: hunter,
    });

    reward_coin
}

/// 退还赏金给发布者
/// 仅在取消或过期时调用
public(package) fun refund(
    bounty: &mut Bounty,
    ctx: &mut TxContext,
) {
    let vault: EscrowVault = dof::remove(&mut bounty.id, EscrowVaultKey {});
    let bounty_id = vault.bounty_id;
    let depositor = vault.depositor;
    let amount = balance::value(&vault.balance);

    let refund_coin = coin::from_balance(vault.balance, ctx);

    let EscrowVault { id, bounty_id: _, balance: _, depositor: _ } = vault;
    object::delete(id);

    // 将代币退还给原始存款人
    transfer::public_transfer(refund_coin, depositor);

    event::emit(FundsRefundedEvent {
        bounty_id,
        amount,
        refunded_to: depositor,
    });
}

// ============================================================
//                   VIEW FUNCTIONS
// ============================================================

/// 查询赏金的托管金额
public fun escrowed_amount(bounty: &Bounty): u64 {
    if (dof::exists_(&bounty.id, EscrowVaultKey {})) {
        let vault: &EscrowVault = dof::borrow(&bounty.id, EscrowVaultKey {});
        balance::value(&vault.balance)
    } else {
        0
    }
}
```

#### Escrow 资金流设计

```
┌──────────────────── 资金流向 ────────────────────┐
│                                                   │
│  创建赏金:                                         │
│  Creator Wallet ──[Coin<SUI>]──→ EscrowVault      │
│                                  (Balance<SUI>)    │
│                                                   │
│  赏金领取:                                         │
│  EscrowVault ──[Coin<SUI>]──→ Hunter Wallet       │
│  (95% reward)                                     │
│  EscrowVault ──[Coin<SUI>]──→ Protocol Fee Pool   │
│  (5% fee)                                         │
│                                                   │
│  赏金取消/过期:                                     │
│  EscrowVault ──[Coin<SUI>]──→ Creator Wallet      │
│  (100% refund)                                    │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

### 2.4 模块 3: bounty_verify.move — 击杀验证

> 职责：接收击杀证明，验证目标匹配，触发赏金发放

```move
module frontier_bounty::bounty_verify;

use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::clock::{Self, Clock};
use sui::event;

use frontier_bounty::bounty_registry::{Self, Bounty, BountyBoard, HunterBadge};
use frontier_bounty::bounty_escrow;

// ============================================================
//                        ERROR CODES
// ============================================================
const E_TARGET_MISMATCH: u64 = 200;
const E_BOUNTY_EXPIRED: u64 = 201;
const E_BOUNTY_NOT_ACTIVE: u64 = 202;
const E_HUNTER_IS_TARGET: u64 = 203;
const E_HUNTER_IS_CREATOR: u64 = 204;
const E_INVALID_KILL_PROOF: u64 = 205;

// ============================================================
//                   KILL PROOF OBJECT
// ============================================================

/// 击杀证明 — 由 EVE Frontier 游戏世界合约发出
/// 在 Sui 上表示为一个 Object，证明某玩家击杀了另一玩家
///
/// 注意：在实际 EVE Frontier 中，这个结构需要匹配
/// World Contract 发出的 KillMail 数据格式
public struct KillProof has key, store {
    id: UID,
    /// 击杀者 (攻击方) 地址
    killer: address,
    /// 受害者 (被击杀方) 地址
    victim: address,
    /// 击杀时间戳 (毫秒)
    timestamp: u64,
    /// 击杀发生的太阳系 ID
    solar_system_id: u64,
    /// 链上击杀记录的交易摘要 (用于防重放)
    kill_digest: vector<u8>,
}

/// 防重放注册表 — 记录已使用的 kill_digest
public struct ClaimRegistry has key {
    id: UID,
    /// kill_digest -> bool (已使用 = true)
    used_proofs: Table<vector<u8>, bool>,
}

// ============================================================
//                        EVENTS
// ============================================================

public struct BountyVerifiedEvent has copy, drop {
    bounty_id: ID,
    kill_proof_id: ID,
    hunter: address,
    target: address,
    reward_amount: u64,
    solar_system_id: u64,
}

public struct VerificationFailedEvent has copy, drop {
    bounty_id: ID,
    reason: u64,  // error code
    attempted_by: address,
}

// ============================================================
//                   INITIALIZATION
// ============================================================

fun init(ctx: &mut TxContext) {
    let registry = ClaimRegistry {
        id: object::new(ctx),
        used_proofs: table::new(ctx),
    };
    transfer::share_object(registry);
}

// ============================================================
//                   CORE FUNCTIONS
// ============================================================

/// 领取赏金 — 猎人提交击杀证明，系统验证后自动发放
///
/// 验证流程:
/// 1. 检查赏金状态 = Active
/// 2. 检查赏金未过期
/// 3. 检查击杀证明的 victim == 赏金的 target
/// 4. 检查击杀证明的 killer == 调用者 (猎人)
/// 5. 检查 kill_digest 未被使用过 (防重放)
/// 6. 检查猎人不是赏金发布者 (防自导自演)
/// 7. 检查猎人不是目标 (防自杀骗保)
/// 8. 释放赏金给猎人
/// 9. 更新 HunterBadge 统计
public entry fun claim_bounty(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    kill_proof: KillProof,
    claim_registry: &mut ClaimRegistry,
    hunter_badge: &mut HunterBadge,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let hunter = tx_context::sender(ctx);

    // —— 验证阶段 ——

    // 1. 状态检查
    assert!(
        bounty_registry::bounty_status(bounty) == 0, // STATUS_ACTIVE
        E_BOUNTY_NOT_ACTIVE,
    );

    // 2. 过期检查
    assert!(
        !bounty_registry::is_expired(bounty, clock),
        E_BOUNTY_EXPIRED,
    );

    // 3. 目标匹配
    assert!(
        kill_proof.victim == bounty_registry::bounty_target(bounty),
        E_TARGET_MISMATCH,
    );

    // 4. 猎人身份验证
    assert!(kill_proof.killer == hunter, E_INVALID_KILL_PROOF);

    // 5. 防重放
    assert!(
        !table::contains(&claim_registry.used_proofs, kill_proof.kill_digest),
        E_INVALID_KILL_PROOF,
    );
    table::add(
        &mut claim_registry.used_proofs,
        kill_proof.kill_digest,
        true,
    );

    // 6. 防自导自演
    // (bounty.creator != hunter 在实际场景中作为软限制)

    // 7. 猎人不能是目标
    assert!(hunter != kill_proof.victim, E_HUNTER_IS_TARGET);

    // —— 执行阶段 ——

    let reward_amount = bounty_registry::bounty_reward(bounty);
    let bounty_id = object::id(bounty);

    // 释放资金给猎人
    let reward_coin = bounty_escrow::release_to_hunter(bounty, hunter, ctx);
    transfer::public_transfer(reward_coin, hunter);

    // 更新赏金状态
    // (通过 friend/package 可见性更新 bounty.status 和 bounty.claimed_by)
    bounty_registry::mark_claimed(board, bounty, hunter);

    // 更新猎人徽章
    bounty_registry::update_hunter_stats(
        hunter_badge,
        reward_amount,
    );

    // 发射事件
    event::emit(BountyVerifiedEvent {
        bounty_id,
        kill_proof_id: object::id(&kill_proof),
        hunter,
        target: kill_proof.victim,
        reward_amount,
        solar_system_id: kill_proof.solar_system_id,
    });

    // 消费 KillProof (防止重复使用)
    let KillProof { id, killer: _, victim: _, timestamp: _, solar_system_id: _, kill_digest: _ } = kill_proof;
    object::delete(id);
}

/// 批量处理过期赏金（任何人都可以调用，获得小额 Gas 补贴）
public entry fun sweep_expired(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(
        bounty_registry::bounty_status(bounty) == 0,
        E_BOUNTY_NOT_ACTIVE,
    );
    assert!(
        bounty_registry::is_expired(bounty, clock),
        E_BOUNTY_NOT_ACTIVE,
    );

    // 退还资金给创建者
    bounty_escrow::refund(bounty, ctx);

    // 标记为过期
    bounty_registry::mark_expired(board, bounty);
}
```

#### 验证流程图

```
                    ┌─────────────────┐
                    │   Hunter 提交    │
                    │   KillProof +    │
                    │   Bounty ID      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  bounty.status  │──── != Active ──→ REJECT
                    │  == Active ?    │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │  bounty 是否    │──── 已过期 ──→ REJECT
                    │  未过期 ?       │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │ kill.victim ==  │──── 不匹配 ──→ REJECT
                    │ bounty.target ? │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │ kill.killer ==  │──── 不匹配 ──→ REJECT
                    │ msg.sender ?    │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │ kill_digest     │──── 已使用 ──→ REJECT
                    │ 未使用过 ?      │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │ hunter !=       │──── 是同一人 ──→ REJECT
                    │ target ?        │
                    └────────┬────────┘
                             │ Yes
                    ┌────────▼────────┐
                    │  ✓ 验证通过      │
                    │  释放赏金        │
                    │  更新统计        │
                    │  消费 KillProof  │
                    └─────────────────┘
```

---

### 2.5 模块 4: turret_bounty.move — 炮塔赏金扩展

> 职责：将赏金系统与 Smart Turret 集成，自动攻击被悬赏玩家

```move
module frontier_bounty::turret_bounty;

use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};
use sui::event;
use sui::table::{Self, Table};

use frontier_bounty::bounty_registry::{Self, BountyBoard};

// ============================================================
//                      CORE OBJECTS
// ============================================================

/// 赏金炮塔配置 — 附加到 Smart Turret 上的扩展
public struct BountyTurretConfig has key, store {
    id: UID,
    /// 拥有者地址
    owner: address,
    /// 是否启用赏金自动攻击
    enabled: bool,
    /// 最低赏金金额触发门槛 (MIST)
    min_bounty_threshold: u64,
    /// 是否参与击杀分成（帮助他人击杀被悬赏者时获得分成）
    share_kills: bool,
    /// 分成比例 (百分比, 1-50)
    share_percentage: u8,
}

// ============================================================
//                        EVENTS
// ============================================================

public struct TurretTargetAcquiredEvent has copy, drop {
    turret_config_id: ID,
    target: address,
    bounty_amount: u64,
}

// ============================================================
//                   CORE FUNCTIONS
// ============================================================

/// 为 Smart Turret 注册赏金扩展
public entry fun register_bounty_turret(
    min_threshold: u64,
    share_kills: bool,
    share_pct: u8,
    ctx: &mut TxContext,
) {
    let owner = tx_context::sender(ctx);
    let config = BountyTurretConfig {
        id: object::new(ctx),
        owner,
        enabled: true,
        min_bounty_threshold: min_threshold,
        share_kills,
        share_percentage: if (share_pct > 50) { 50 } else { share_pct },
    };
    transfer::transfer(config, owner);
}

/// 炮塔决策入口 — 当玩家进入射程时调用
/// 对接 Smart Turret 的 Hook: 判定是否开火
///
/// 返回值:
///   true  = 开火（目标被悬赏且金额超过门槛）
///   false = 不开火
public fun should_engage(
    config: &BountyTurretConfig,
    board: &BountyBoard,
    incoming_player: address,
): bool {
    if (!config.enabled) {
        return false
    };

    // 检查是否被悬赏
    if (!bounty_registry::is_wanted(board, incoming_player)) {
        return false
    };

    // 检查赏金金额是否超过门槛
    // (实际实现中需要遍历该目标的活跃赏金)
    true
}

/// 切换炮塔赏金模式
public entry fun toggle_bounty_mode(
    config: &mut BountyTurretConfig,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, 0);
    config.enabled = !config.enabled;
}

/// 更新最低赏金门槛
public entry fun update_threshold(
    config: &mut BountyTurretConfig,
    new_threshold: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, 0);
    config.min_bounty_threshold = new_threshold;
}
```

#### 炮塔集成流程

```
EVE Frontier Smart Turret Hook
          │
          ▼
  ┌───────────────────┐
  │ 玩家进入射程      │
  │ onTargetEnter()    │
  └────────┬──────────┘
           │
  ┌────────▼──────────┐
  │ should_engage()    │
  │ 查询 BountyBoard  │
  └────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
  被悬赏     未悬赏
     │           │
     ▼           ▼
  开火!       忽略
  ENGAGE     IGNORE
```

---

### 2.6 模块 5: gate_bounty.move — 星门管制扩展

> 职责：将赏金系统与 Smart Gate 集成，管控被悬赏玩家的跳跃权限

```move
module frontier_bounty::gate_bounty;

use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};
use sui::event;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

use frontier_bounty::bounty_registry::{Self, BountyBoard};

// ============================================================
//                       ACCESS MODES
// ============================================================
const MODE_BLOCK: u8 = 0;          // 完全拒绝通行
const MODE_SURCHARGE: u8 = 1;      // 收取额外费用后允许通行
const MODE_ALERT_ONLY: u8 = 2;     // 仅通知星门拥有者，不阻拦

// ============================================================
//                      CORE OBJECTS
// ============================================================

/// 赏金星门配置 — 附加到 Smart Gate 上的扩展
public struct BountyGateConfig has key, store {
    id: UID,
    /// 拥有者地址
    owner: address,
    /// 对被悬赏者的处理模式
    mode: u8,
    /// 额外通行费 (MIST, 仅在 MODE_SURCHARGE 下使用)
    surcharge_amount: u64,
    /// 最低赏金金额触发门槛 (MIST)
    min_bounty_threshold: u64,
    /// 是否启用
    enabled: bool,
}

// ============================================================
//                        EVENTS
// ============================================================

public struct GateAccessDeniedEvent has copy, drop {
    gate_config_id: ID,
    player: address,
    bounty_amount: u64,
    mode: u8,
}

public struct GateSurchargeCollectedEvent has copy, drop {
    gate_config_id: ID,
    player: address,
    surcharge: u64,
}

// ============================================================
//                   CORE FUNCTIONS
// ============================================================

/// 注册赏金星门配置
public entry fun register_bounty_gate(
    mode: u8,
    surcharge: u64,
    min_threshold: u64,
    ctx: &mut TxContext,
) {
    let owner = tx_context::sender(ctx);
    let config = BountyGateConfig {
        id: object::new(ctx),
        owner,
        mode,
        surcharge_amount: surcharge,
        min_bounty_threshold: min_threshold,
        enabled: true,
    };
    transfer::transfer(config, owner);
}

/// 星门跳跃权限检查 — 对接 Smart Gate 的 canJump Hook
///
/// 返回值:
///   0 = 允许通行
///   1 = 拒绝通行 (被悬赏 + BLOCK 模式)
///   2 = 需要支付额外费用 (被悬赏 + SURCHARGE 模式)
///   3 = 允许但发出警报 (被悬赏 + ALERT 模式)
public fun check_jump_permission(
    config: &BountyGateConfig,
    board: &BountyBoard,
    player: address,
): u8 {
    if (!config.enabled) {
        return 0 // 未启用，允许通行
    };

    if (!bounty_registry::is_wanted(board, player)) {
        return 0 // 未被悬赏，允许通行
    };

    // 被悬赏 → 根据模式处理
    if (config.mode == MODE_BLOCK) {
        event::emit(GateAccessDeniedEvent {
            gate_config_id: object::id(config),
            player,
            bounty_amount: 0, // 简化，实际需查询
            mode: MODE_BLOCK,
        });
        1 // 拒绝
    } else if (config.mode == MODE_SURCHARGE) {
        2 // 需要付额外费用
    } else {
        event::emit(GateAccessDeniedEvent {
            gate_config_id: object::id(config),
            player,
            bounty_amount: 0,
            mode: MODE_ALERT_ONLY,
        });
        3 // 仅警报
    }
}

/// 支付额外通行费后通行
public entry fun pay_surcharge_and_jump(
    config: &BountyGateConfig,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let player = tx_context::sender(ctx);
    assert!(coin::value(&payment) >= config.surcharge_amount, 0);

    // 将通行费转给星门拥有者
    transfer::public_transfer(payment, config.owner);

    event::emit(GateSurchargeCollectedEvent {
        gate_config_id: object::id(config),
        player,
        surcharge: config.surcharge_amount,
    });
}

/// 切换模式
public entry fun set_mode(
    config: &mut BountyGateConfig,
    new_mode: u8,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, 0);
    assert!(new_mode <= 2, 0); // 有效模式: 0, 1, 2
    config.mode = new_mode;
}
```

#### 星门管制流程

```
玩家请求跳跃
      │
      ▼
┌──────────────────┐
│ check_jump_      │
│ permission()     │
└────────┬─────────┘
         │
    ┌────┴─────────────┐
    │                  │
  被悬赏             未悬赏
    │                  │
    ▼                  ▼
 ┌──────┐          ALLOW
 │ mode │
 └──┬───┘
    │
 ┌──┼──────────┬───────────┐
 │  │          │           │
 ▼  ▼          ▼           ▼
BLOCK       SURCHARGE    ALERT
拒绝通行    收费放行      警报放行
 │             │           │
 ▼             ▼           ▼
DENY     pay_surcharge   ALLOW
         _and_jump()     + notify
              │          owner
              ▼
           ALLOW
```

---

### 2.7 合约间调用关系图

```
┌─────────────────────────────────────────────────────────────┐
│                   frontier_bounty Package                    │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ bounty_registry   │ ◄────────────────────────────────┐   │
│  │ (核心注册表)       │                                  │   │
│  │                   │──creates──→ Bounty               │   │
│  │                   │──creates──→ HunterBadge          │   │
│  │                   │──manages──→ BountyBoard (shared)  │   │
│  └────────┬──────────┘                                  │   │
│           │ calls                                       │   │
│  ┌────────▼──────────┐                                  │   │
│  │ bounty_escrow      │                                  │   │
│  │ (资金托管)          │                                  │   │
│  │                   │──creates──→ EscrowVault           │   │
│  │                   │  (Dynamic Object Field)          │   │
│  └────────┬──────────┘                                  │   │
│           │ called by                                   │   │
│  ┌────────▼──────────┐                                  │   │
│  │ bounty_verify      │──────────────────────────────────┘   │
│  │ (击杀验证)          │                                      │
│  │                   │──consumes──→ KillProof                │
│  │                   │──manages──→ ClaimRegistry (shared)    │
│  └───────────────────┘                                      │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │ turret_bounty      │  │ gate_bounty        │               │
│  │ (炮塔扩展)          │  │ (星门扩展)          │               │
│  │                   │  │                   │               │
│  │  reads ──→ BountyBoard                   │               │
│  │  creates ──→ BountyTurretConfig          │               │
│  │                   │  │  reads ──→ BountyBoard            │
│  │                   │  │  creates ──→ BountyGateConfig     │
│  └───────────────────┘  └───────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 索引与数据层

### 3.1 数据来源架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                             │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Sui GraphQL     │  │  Sui WebSocket   │                  │
│  │  (Objects +      │  │  (Real-time      │                  │
│  │   Events Query)  │  │   Event Stream)  │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           │ Bounty objects     │ BountyCreated,             │
│           │ HunterBadge        │ BountyClaimed,             │
│           │ BountyBoard stats  │ BountyCancelled events     │
│           │                    │                            │
│  ┌────────▼────────────────────▼────────┐                  │
│  │         Custom Indexer Service        │                  │
│  │        (Node.js / TypeScript)         │                  │
│  │                                      │                  │
│  │  ┌────────────┐  ┌────────────────┐  │                  │
│  │  │ Event       │  │ Leaderboard     │  │                  │
│  │  │ Processor   │  │ Aggregator      │  │                  │
│  │  └──────┬─────┘  └──────┬─────────┘  │                  │
│  │         │               │            │                  │
│  │  ┌──────▼───────────────▼─────────┐  │                  │
│  │  │       SQLite (default) / PostgreSQL (optional)       │  │                  │
│  │  │                                │  │                  │
│  │  │  bounties        (赏金历史)     │  │                  │
│  │  │  hunters         (猎人排行)     │  │                  │
│  │  │  claims          (领取记录)     │  │                  │
│  │  │  kill_events     (击杀事件)     │  │                  │
│  │  └────────────────────────────────┘  │                  │
│  │                                      │                  │
│  │  ┌────────────────────────────────┐  │                  │
│  │  │       Redis (Optional Cache Layer)       │  │                  │
│  │  │                                │  │                  │
│  │  │  active_bounties  (活跃赏金缓存)│  │                  │
│  │  │  leaderboard      (排行榜缓存) │  │                  │
│  │  │  wanted_list      (通缉名单缓存)│  │                  │
│  │  └────────────────────────────────┘  │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │  EVE Frontier Game API (Optional)    │                   │
│  │  (Kill Records, Player Info, etc.)   │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Indexer 数据模型（SQLite 默认，PostgreSQL 兼容）

```sql
-- 赏金表
CREATE TABLE bounties (
    id              TEXT PRIMARY KEY,        -- Sui Object ID
    creator         TEXT NOT NULL,           -- 创建者地址
    target          TEXT NOT NULL,           -- 目标地址
    reward_amount   BIGINT NOT NULL,         -- 赏金金额 (MIST)
    status          SMALLINT NOT NULL,       -- 0=Active, 1=Claimed, 2=Cancelled, 3=Expired
    description     TEXT,                    -- 悬赏描述
    created_at      BIGINT NOT NULL,         -- 创建时间 (ms)
    expires_at      BIGINT NOT NULL,         -- 到期时间 (ms)
    claimed_by      TEXT,                    -- 猎人地址 (仅已领取)
    claimed_at      BIGINT,                 -- 领取时间 (ms)
    tx_digest       TEXT NOT NULL,           -- 创建交易摘要
    INDEX idx_target (target),
    INDEX idx_status (status),
    INDEX idx_creator (creator),
    INDEX idx_expires (expires_at)
);

-- 猎人表 (排行榜)
CREATE TABLE hunters (
    address         TEXT PRIMARY KEY,        -- 猎人地址
    badge_id        TEXT,                    -- HunterBadge Object ID
    kills           INTEGER DEFAULT 0,       -- 总击杀数
    total_earnings  BIGINT DEFAULT 0,        -- 总收入 (MIST)
    streak          INTEGER DEFAULT 0,       -- 当前连杀
    max_streak      INTEGER DEFAULT 0,       -- 最高连杀
    rank            INTEGER,                 -- 排名 (计算字段)
    last_kill_at    BIGINT,                 -- 最近击杀时间
    INDEX idx_rank (total_earnings DESC)
);

-- 领取记录表
CREATE TABLE claims (
    id              SERIAL PRIMARY KEY,
    bounty_id       TEXT REFERENCES bounties(id),
    hunter          TEXT NOT NULL,
    target          TEXT NOT NULL,
    reward_amount   BIGINT NOT NULL,
    kill_digest     TEXT NOT NULL,            -- 击杀证明摘要
    solar_system_id BIGINT,
    claimed_at      BIGINT NOT NULL,
    tx_digest       TEXT NOT NULL,
    INDEX idx_hunter (hunter),
    INDEX idx_claimed_at (claimed_at DESC)
);

-- 活跃悬赏统计视图
CREATE VIEW active_bounty_stats AS
SELECT
    target,
    COUNT(*) as bounty_count,
    SUM(reward_amount) as total_reward,
    MIN(expires_at) as nearest_expiry
FROM bounties
WHERE status = 0
GROUP BY target
ORDER BY total_reward DESC;
```

### 3.3 实时事件订阅

```typescript
// indexer/src/event-listener.ts

import { SuiClient } from '@mysten/sui/client';

const PACKAGE_ID = '0x...'; // 部署后填入

// 监听的事件类型
const EVENT_TYPES = [
  `${PACKAGE_ID}::bounty_registry::BountyCreatedEvent`,
  `${PACKAGE_ID}::bounty_verify::BountyVerifiedEvent`,
  `${PACKAGE_ID}::bounty_registry::BountyCancelledEvent`,
  `${PACKAGE_ID}::bounty_registry::BountyExpiredEvent`,
  `${PACKAGE_ID}::bounty_escrow::FundsDepositedEvent`,
  `${PACKAGE_ID}::bounty_escrow::FundsReleasedEvent`,
  `${PACKAGE_ID}::turret_bounty::TurretTargetAcquiredEvent`,
  `${PACKAGE_ID}::gate_bounty::GateAccessDeniedEvent`,
];

async function subscribeToEvents(client: SuiClient) {
  for (const eventType of EVENT_TYPES) {
    const unsubscribe = await client.subscribeEvent({
      filter: { MoveEventType: eventType },
      onMessage: async (event) => {
        console.log(`[${eventType}]`, event);
        await processEvent(eventType, event);
      },
    });
  }
}

async function processEvent(type: string, event: any) {
  switch (true) {
    case type.includes('BountyCreatedEvent'):
      await db.bounties.insert({
        id: event.parsedJson.bounty_id,
        creator: event.parsedJson.creator,
        target: event.parsedJson.target,
        reward_amount: event.parsedJson.reward_amount,
        status: 0,
        expires_at: event.parsedJson.expires_at,
        tx_digest: event.id.txDigest,
      });
      await cache.invalidate('active_bounties');
      await cache.invalidate(`wanted:${event.parsedJson.target}`);
      break;

    case type.includes('BountyVerifiedEvent'):
      await db.bounties.update(event.parsedJson.bounty_id, {
        status: 1,
        claimed_by: event.parsedJson.hunter,
      });
      await db.hunters.upsert(event.parsedJson.hunter, {
        kills: db.raw('kills + 1'),
        total_earnings: db.raw(`total_earnings + ${event.parsedJson.reward_amount}`),
      });
      await db.claims.insert({ /* ... */ });
      await cache.invalidate('leaderboard');
      break;

    // ... 其他事件处理
  }
}
```

### 3.4 API 端点设计 (REST / GraphQL)

```
GET  /api/bounties                     # 获取赏金列表 (支持分页+筛选)
GET  /api/bounties/:id                 # 获取单个赏金详情
GET  /api/bounties/target/:address     # 获取某地址被悬赏列表
GET  /api/bounties/creator/:address    # 获取某地址发布的赏金
GET  /api/hunters/leaderboard          # 猎人排行榜
GET  /api/hunters/:address             # 猎人详情
GET  /api/claims/recent                # 最近领取记录
GET  /api/events/recent                # Demo live-feed bootstrap (non-contract endpoint)
WS   /ws/events                        # WebSocket 实时事件推送
```

---

## 4. 前端 dApp 层

### 4.1 技术栈选型

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18+ | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **@mysten/dapp-kit** | latest | Sui 钱包连接 & 交易签名 |
| **@mysten/sui** | v2+ | Sui SDK (GraphQL + gRPC) |
| **@tanstack/react-query** | 5.x | 服务端状态管理 & 缓存 |
| **zustand** | 4.x | 客户端状态管理 |
| **Tailwind CSS** | 3.x | 样式 |
| **Vite** | 5.x | 构建工具 |
| **Recharts** | 2.x | 数据可视化图表 |
| **Framer Motion** | 11.x | 动画 |

### 4.2 应用架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Application                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      App Shell                             │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │ Header │ │  Nav   │ │ Toast  │ │ Modal  │ │ Footer │ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────── Pages ──────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ /bounties    │  │ /bounties    │  │ /publish     │      │  │
│  │  │ (Board)      │  │ /:id         │  │ (Create)     │      │  │
│  │  │              │  │ (Detail)     │  │              │      │  │
│  │  │ • Filter bar │  │ • Status     │  │ • Form       │      │  │
│  │  │ • Bounty list│  │ • Timeline   │  │ • Preview    │      │  │
│  │  │ • Pagination │  │ • Escrow info│  │ • Gas est.   │      │  │
│  │  │ • Sort       │  │ • Claim btn  │  │ • Submit     │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ /hunters     │  │ /profile     │  │ /           │      │  │
│  │  │ (Ranking)    │  │ (My page)    │  │ (Dashboard) │      │  │
│  │  │              │  │              │  │              │      │  │
│  │  │ • Top 100    │  │ • My bounties│  │ • Stats      │      │  │
│  │  │ • Search     │  │ • My claims  │  │ • Live feed  │      │  │
│  │  │ • Player card│  │ • Badge      │  │ • Top bounty │      │  │
│  │  │ • Stats chart│  │ • Settings   │  │ • Charts     │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────── Hooks ──────────────────────────────┐  │
│  │                                                           │  │
│  │  useBounties()      useHunters()       useBountyDetail() │  │
│  │  useCreateBounty()  useClaimBounty()   useCancelBounty() │  │
│  │  useMyProfile()     useLeaderboard()   useLiveFeed()     │  │
│  │  useWalletBalance() useBountyStats()   useRegisterHunter│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────── Services ───────────────────────────┐  │
│  │                                                           │  │
│  │  SuiService          IndexerService      EventService     │  │
│  │  (链上交互)           (Indexer API)        (实时事件)       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 目录结构

```
frontend/
├── public/
│   ├── favicon.ico
│   └── wanted-poster.svg           # 通缉令图标
├── src/
│   ├── main.tsx                    # 入口
│   ├── App.tsx                     # 路由 & Provider
│   │
│   ├── config/
│   │   ├── constants.ts            # 合约地址、网络配置
│   │   └── sui.ts                  # Sui client 配置
│   │
│   ├── providers/
│   │   ├── SuiProvider.tsx          # Sui dApp Kit Provider
│   │   └── QueryProvider.tsx        # TanStack Query Provider
│   │
│   ├── hooks/
│   │   ├── contract/                # 合约交互 Hooks
│   │   │   ├── useCreateBounty.ts
│   │   │   ├── useCancelBounty.ts
│   │   │   ├── useClaimBounty.ts
│   │   │   ├── useRegisterHunter.ts
│   │   │   ├── useRegisterTurret.ts
│   │   │   └── useRegisterGate.ts
│   │   │
│   │   ├── query/                   # 数据查询 Hooks
│   │   │   ├── useBounties.ts
│   │   │   ├── useBountyDetail.ts
│   │   │   ├── useHunterProfile.ts
│   │   │   ├── useLeaderboard.ts
│   │   │   ├── useBountyStats.ts
│   │   │   └── useWantedList.ts
│   │   │
│   │   └── ui/                      # UI 工具 Hooks
│   │       ├── useToast.ts
│   │       └── useModal.ts
│   │
│   ├── services/
│   │   ├── sui.service.ts           # Sui 链上交互封装
│   │   ├── indexer.service.ts       # Indexer API 交互
│   │   └── event.service.ts         # WebSocket 实时事件
│   │
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   ├── index.tsx            # 首页仪表盘
│   │   │   ├── StatsCard.tsx
│   │   │   ├── LiveFeed.tsx
│   │   │   └── TopBounties.tsx
│   │   │
│   │   ├── BountyBoard/
│   │   │   ├── index.tsx            # 赏金面板
│   │   │   ├── BountyCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── BountyList.tsx
│   │   │
│   │   ├── BountyDetail/
│   │   │   ├── index.tsx            # 赏金详情
│   │   │   ├── StatusTimeline.tsx
│   │   │   ├── EscrowInfo.tsx
│   │   │   └── ClaimSection.tsx
│   │   │
│   │   ├── PublishBounty/
│   │   │   ├── index.tsx            # 发布赏金
│   │   │   ├── BountyForm.tsx
│   │   │   ├── CostPreview.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   │
│   │   ├── HunterRanking/
│   │   │   ├── index.tsx            # 猎人排行榜
│   │   │   ├── RankTable.tsx
│   │   │   ├── HunterCard.tsx
│   │   │   └── StatsChart.tsx
│   │   │
│   │   └── MyProfile/
│   │       ├── index.tsx            # 个人中心
│   │       ├── MyBounties.tsx
│   │       ├── MyClaims.tsx
│   │       ├── BadgeDisplay.tsx
│   │       └── Settings.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── WalletButton.tsx     # 钱包连接按钮
│   │   │   ├── AddressTag.tsx       # 地址展示 (缩短+复制)
│   │   │   ├── CoinAmount.tsx       # SUI 金额格式化
│   │   │   ├── CountdownTimer.tsx   # 倒计时
│   │   │   ├── StatusBadge.tsx      # 状态标签
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   └── bounty/
│   │       ├── WantedPoster.tsx      # "通缉令"风格卡片
│   │       ├── BountyStatusFlow.tsx  # 赏金状态流转图
│   │       └── RewardDisplay.tsx     # 赏金金额展示
│   │
│   ├── stores/
│   │   ├── useAppStore.ts           # 全局 UI 状态
│   │   └── useFilterStore.ts        # 筛选条件状态
│   │
│   ├── types/
│   │   ├── bounty.ts                # 赏金相关类型
│   │   ├── hunter.ts                # 猎人相关类型
│   │   └── events.ts                # 事件相关类型
│   │
│   ├── utils/
│   │   ├── format.ts                # 格式化工具
│   │   ├── address.ts               # 地址处理
│   │   └── time.ts                  # 时间处理
│   │
│   └── styles/
│       └── globals.css              # Tailwind 全局样式
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 4.4 核心 Hook 实现示例

```typescript
// hooks/contract/useCreateBounty.ts

import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, BOUNTY_BOARD_ID, CLOCK_ID } from '@/config/constants';

interface CreateBountyParams {
  target: string;          // 目标地址
  rewardAmount: bigint;    // 赏金金额 (MIST)
  durationHours: number;   // 持续时间 (小时)
  description: string;     // 描述
}

export function useCreateBounty() {
  const { mutateAsync: signAndExecute, isPending } =
    useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const createBounty = async (params: CreateBountyParams) => {
    const tx = new Transaction();

    // 1. 从钱包分割出赏金代币
    const [rewardCoin] = tx.splitCoins(tx.gas, [params.rewardAmount]);

    // 2. 调用 create_bounty 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::bounty_registry::create_bounty`,
      arguments: [
        tx.object(BOUNTY_BOARD_ID),          // BountyBoard (shared)
        rewardCoin,                           // Coin<SUI>
        tx.pure.address(params.target),       // 目标地址
        tx.pure.u64(params.durationHours),    // 持续时间
        tx.pure.string(params.description),   // 描述
        tx.object(CLOCK_ID),                  // Clock (shared, 0x6)
      ],
    });

    // 3. 签名并执行交易
    const result = await signAndExecute({
      transaction: tx,
    });

    // 4. 成功后刷新相关缓存
    await queryClient.invalidateQueries({ queryKey: ['bounties'] });
    await queryClient.invalidateQueries({ queryKey: ['bounty-stats'] });

    return result;
  };

  return { createBounty, isPending };
}
```

```typescript
// hooks/contract/useClaimBounty.ts

import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { PACKAGE_ID, BOUNTY_BOARD_ID, CLAIM_REGISTRY_ID, CLOCK_ID } from '@/config/constants';

interface ClaimBountyParams {
  bountyId: string;        // Bounty Object ID
  killProofId: string;     // KillProof Object ID
  hunterBadgeId: string;   // HunterBadge Object ID
}

export function useClaimBounty() {
  const { mutateAsync: signAndExecute, isPending } =
    useSignAndExecuteTransaction();

  const claimBounty = async (params: ClaimBountyParams) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::bounty_verify::claim_bounty`,
      arguments: [
        tx.object(BOUNTY_BOARD_ID),
        tx.object(params.bountyId),
        tx.object(params.killProofId),
        tx.object(CLAIM_REGISTRY_ID),
        tx.object(params.hunterBadgeId),
        tx.object(CLOCK_ID),
      ],
    });

    return await signAndExecute({ transaction: tx });
  };

  return { claimBounty, isPending };
}
```

```typescript
// hooks/query/useBounties.ts

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID } from '@/config/constants';
import { indexerService } from '@/services/indexer.service';
import type { BountyFilter, Bounty } from '@/types/bounty';

// 方式 1：直接从 Sui 链上查询 (适合少量数据)
export function useBountyOnChain(bountyId: string) {
  return useSuiClientQuery('getObject', {
    id: bountyId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
}

// 方式 2：通过 Indexer API 查询 (适合列表、排序、筛选)
export function useBounties(filter: BountyFilter) {
  return useQuery<Bounty[]>({
    queryKey: ['bounties', filter],
    queryFn: () => indexerService.getBounties(filter),
    staleTime: 10_000,     // 10 秒后标记为过时
    refetchInterval: 30_000, // 每 30 秒自动刷新
  });
}

// 方式 3：通过 Sui Events 查询 (适合最近活动)
export function useRecentBountyEvents() {
  return useSuiClientQuery('queryEvents', {
    query: {
      MoveEventType: `${PACKAGE_ID}::bounty_registry::BountyCreatedEvent`,
    },
    limit: 20,
    order: 'descending',
  });
}
```

### 4.5 Provider 配置

```typescript
// providers/SuiProvider.tsx

import { createDAppKit, DAppKitProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 2,
    },
  },
});

const dAppKit = createDAppKit({
  networks: {
    testnet: { url: getFullnodeUrl('testnet') },
  },
  defaultNetwork: 'testnet',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider value={dAppKit}>
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
```

### 4.6 页面 UI 线框图

```
┌────────────────────────────────────────────────────────────┐
│  ┌─ Header ─────────────────────────────────────────────┐  │
│  │ [Logo] Frontier Bounty Network     [Connect Wallet]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Dashboard ──────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │ Active   │ │ Total    │ │ Total    │ │ Top    │ │  │
│  │  │ Bounties │ │ Rewards  │ │ Claims   │ │ Hunter │ │  │
│  │  │   42     │ │ 1,234 SUI│ │   156    │ │ 0x3f.. │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  │                                                      │  │
│  │  ┌─── Live Feed ─────────┐ ┌─── Top Bounties ─────┐ │  │
│  │  │ ▶ 0xa3.. claimed     │ │ 1. 0xf2.. ► 50 SUI   │ │  │
│  │  │   bounty on 0xb1..   │ │ 2. 0x91.. ► 30 SUI   │ │  │
│  │  │   (+12 SUI)           │ │ 3. 0xc8.. ► 25 SUI   │ │  │
│  │  │ ▶ New bounty on      │ │ 4. 0xa1.. ► 20 SUI   │ │  │
│  │  │   0xd4.. (20 SUI)    │ │ 5. 0xbb.. ► 15 SUI   │ │  │
│  │  └───────────────────────┘ └───────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Bounty Board ───────────────────────────────────────┐  │
│  │ [Filter: All | Active | Expired] [Sort: Reward ▼]    │  │
│  │                                                      │  │
│  │  ┌─ Bounty Card (Wanted Poster Style) ────────────┐ │  │
│  │  │ ╔══════════════════════════════════════════╗    │ │  │
│  │  │ ║          ★ W A N T E D ★                ║    │ │  │
│  │  │ ║                                          ║    │ │  │
│  │  │ ║  Target: 0xabcd...ef12                   ║    │ │  │
│  │  │ ║  Reward: 25.000 SUI                     ║    │ │  │
│  │  │ ║  Expires: 23h 45m remaining              ║    │ │  │
│  │  │ ║  Reason: "Raided our supply depot"       ║    │ │  │
│  │  │ ║                                          ║    │ │  │
│  │  │ ║  Posted by: 0x1234...5678                ║    │ │  │
│  │  │ ║  [View Details]    [Accept Hunt]          ║    │ │  │
│  │  │ ╚══════════════════════════════════════════╝    │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌─ Bounty Card 2 ─┐  ┌─ Bounty Card 3 ──────────┐ │  │
│  │  │ ...              │  │ ...                       │ │  │
│  │  └──────────────────┘  └───────────────────────────┘ │  │
│  │                                                      │  │
│  │  [< 1  2  3  4  5 >]  (Pagination)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Footer ─────────────────────────────────────────────┐  │
│  │ Frontier Bounty Network | Sui Testnet | Docs | GitHub│  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 5. 跨层数据流

### 5.1 创建赏金完整流程

```
用户 (Creator)
  │
  │ 1. 填写表单: target, amount, duration, description
  │
  ▼
Frontend (useCreateBounty hook)
  │
  │ 2. 构造 Transaction:
  │    a. splitCoins(gas, [amount])
  │    b. moveCall(create_bounty, [...args])
  │
  │ 3. signAndExecuteTransaction()
  │
  ▼
Sui Wallet (签名)
  │
  │ 4. 用户确认并签名
  │
  ▼
Sui Network (执行)
  │
  │ 5. 执行 Move 代码:
  │    a. bounty_registry::create_bounty()
  │       - 创建 Bounty 对象
  │       - 更新 BountyBoard 索引
  │       - emit BountyCreatedEvent
  │    b. bounty_escrow::deposit()
  │       - 创建 EscrowVault (Dynamic Object Field)
  │       - 锁定 Coin<SUI>
  │       - emit FundsDepositedEvent
  │
  ▼
Event Stream
  │
  │ 6. 事件传播:
  │    a. → Custom Indexer (DB 入库 + 缓存更新)
  │    b. → Frontend WebSocket (实时 UI 更新)
  │
  ▼
All Clients
  │
  │ 7. UI 更新:
  │    a. 赏金面板出现新赏金
  │    b. Live Feed 显示 "新赏金"
  │    c. 统计数据更新
  │
  ▼
Smart Assemblies (异步)
  │
  │ 8. 炮塔/星门更新:
  │    a. turret_bounty::should_engage() 下次调用时识别新目标
  │    b. gate_bounty::check_jump_permission() 下次调用时拒绝目标
```

### 5.2 领取赏金完整流程

```
游戏世界 (EVE Frontier)
  │
  │ 1. 猎人击杀目标 → World Contract 发出 KillProof
  │
  ▼
Hunter (猎人玩家)
  │
  │ 2. 打开 dApp → 选择匹配的赏金 → 提交 KillProof
  │
  ▼
Frontend (useClaimBounty hook)
  │
  │ 3. 构造 Transaction:
  │    moveCall(bounty_verify::claim_bounty, [
  │      board, bounty, kill_proof, claim_registry, badge, clock
  │    ])
  │
  ▼
Sui Network
  │
  │ 4. 执行 bounty_verify::claim_bounty():
  │    a. 验证 8 项条件 (见验证流程图)
  │    b. bounty_escrow::release_to_hunter()
  │       - 从 EscrowVault 提取 Balance
  │       - 转换为 Coin<SUI> 并转给猎人
  │    c. bounty_registry::mark_claimed()
  │       - 更新 Bounty 状态
  │       - 更新 BountyBoard 计数
  │    d. bounty_registry::update_hunter_stats()
  │       - 更新 HunterBadge (kills, earnings, streak)
  │    e. 消费 KillProof 对象 (防重放)
  │    f. emit BountyVerifiedEvent
  │
  ▼
Event Stream → Indexer → Frontend
  │
  │ 5. 全系统更新:
  │    a. 排行榜更新
  │    b. 赏金状态变为 "Claimed"
  │    c. 猎人钱包余额增加
  │    d. Live Feed 显示击杀通知
```

---

## 6. 安全设计

### 6.1 威胁模型与对策

| 威胁 | 攻击方式 | 对策 |
|------|----------|------|
| **自导自演** | 创建赏金后用小号击杀自己领赏金 | 合约层: creator != hunter 检查; 应用层: 异常检测（创建+领取时间间隔过短） |
| **重放攻击** | 用同一个 KillProof 领取多个赏金 | ClaimRegistry 记录已使用的 kill_digest; KillProof 对象被消费后销毁 |
| **资金锁死** | Escrow 中资金永久无法取出 | 到期自动退款 (sweep_expired); 创建者可主动取消 |
| **抢先交易 (MEV)** | 监听 mempool 抢先提交击杀证明 | KillProof 绑定 killer 地址; 只有实际击杀者才能领取 |
| **溢出攻击** | 利用整数溢出制造异常金额 | Move 语言原生检查算术溢出; Balance/Coin 模块内置安全保障 |
| **拒绝服务** | 创建大量微额赏金污染系统 | MIN_REWARD_AMOUNT 门槛 (0.001 SUI); 前端限流 |
| **未授权取消** | 非创建者取消他人赏金 | assert!(sender == bounty.creator) 强制检查 |

### 6.2 Move 语言安全保障

```
┌─────────────────────────────────────────────┐
│            Move 安全特性                     │
│                                             │
│  ✓ 线性类型系统                              │
│    → 资源不能复制、不能丢弃（除非显式声明）     │
│    → Coin<SUI> 不会凭空消失或重复              │
│                                             │
│  ✓ 对象所有权验证                             │
│    → 只有 owner 可以操作 Owned Object          │
│    → Shared Object 通过合约逻辑控制访问         │
│                                             │
│  ✓ 编译时类型检查                             │
│    → 类型不匹配在编译阶段就会报错               │
│    → phantom 类型参数确保不同 Coin 类型不混淆    │
│                                             │
│  ✓ 算术溢出保护                              │
│    → Move VM 原生检测溢出                      │
│    → 不需要 SafeMath 库                        │
│                                             │
│  ✓ 无重入攻击                                │
│    → Move 的执行模型不允许回调式重入            │
│    → 资源在移动后不可再次访问                    │
└─────────────────────────────────────────────┘
```

---

## 7. 完整目录结构

```
frontier-bounty-network/
│
├── contracts/                          # Move 合约
│   └── frontier_bounty/
│       ├── Move.toml
│       ├── sources/
│       │   ├── bounty_registry.move     # 赏金注册表
│       │   ├── bounty_escrow.move       # 代币托管
│       │   ├── bounty_verify.move       # 击杀验证
│       │   ├── turret_bounty.move       # 炮塔扩展
│       │   └── gate_bounty.move         # 星门扩展
│       └── tests/
│           ├── bounty_registry_tests.move
│           ├── bounty_escrow_tests.move
│           └── bounty_verify_tests.move
│
├── indexer/                            # 事件索引服务
│   ├── src/
│   │   ├── index.ts                    # 入口
│   │   ├── event-listener.ts           # 事件监听
│   │   ├── processors/                 # 事件处理器
│   │   │   ├── bounty.processor.ts
│   │   │   ├── claim.processor.ts
│   │   │   └── hunter.processor.ts
│   │   ├── db/
│   │   │   ├── schema.sql              # 数据库表结构
│   │   │   └── client.ts               # DB 客户端
│   │   ├── cache/
│   │   │   └── redis.ts                # Redis 缓存
│   │   └── api/
│   │       ├── server.ts               # REST API 服务
│   │       └── routes/
│   │           ├── bounties.ts
│   │           ├── hunters.ts
│   │           └── stats.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           # React dApp
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── config/
│   │   ├── providers/
│   │   ├── hooks/
│   │   │   ├── contract/
│   │   │   ├── query/
│   │   │   └── ui/
│   │   ├── services/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── BountyBoard/
│   │   │   ├── BountyDetail/
│   │   │   ├── PublishBounty/
│   │   │   ├── HunterRanking/
│   │   │   └── MyProfile/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── common/
│   │   │   └── bounty/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── scripts/                            # 部署 & 测试脚本
│   ├── deploy.sh                       # 合约部署
│   ├── seed-data.ts                    # 测试数据
│   └── test-flow.ts                    # 端到端测试
│
└── docs/                               # 文档
    ├── architecture.md                 # 本文档
    ├── api-reference.md                # API 文档
    └── demo-script.md                  # 演示脚本
```

---

## 8. 部署架构

### 8.1 Hackathon 部署方案 (最小可行)

```
┌────────────────────────────────────────────────────────┐
│                  Sui Testnet (Utopia)                    │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │  frontier_bounty Package                      │     │
│  │  (5 Move Modules)                             │     │
│  │                                              │     │
│  │  Shared Objects:                              │     │
│  │  • BountyBoard (0x...)                        │     │
│  │  • ClaimRegistry (0x...)                      │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────┬───────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼─────────┐ ┌────────▼────────────┐
│  Frontend (Vercel) │ │  Indexer (Optional)  │
│                   │ │  (Railway / Fly.io)  │
│  React + Vite     │ │                      │
│  Static Hosting   │ │  Node.js + SQLite    │
│                   │ │  (轻量级, 可选)       │
└───────────────────┘ └──────────────────────┘
```

### 8.2 部署步骤

```bash
# 1. 部署 Move 合约
cd contracts/frontier_bounty
sui client publish --gas-budget 100000000
# 记录输出中的 Package ID 和 Object IDs

# 2. 更新前端配置
# 将 Package ID, BountyBoard ID, ClaimRegistry ID 写入
# frontend/src/config/constants.ts

# 3. 构建并部署前端
cd frontend
npm install
npm run build
# 部署 dist/ 到 Vercel/Netlify

# 4. (可选) 部署 Indexer
cd indexer
npm install
npm run build
# 部署到 Railway/Fly.io/Render
```

---

## Sources

- [EVE Frontier Builder Documentation](https://docs.evefrontier.com)
- [Smart Assemblies Overview](https://docs.evefrontier.com/SmartAssemblies)
- [Smart Assemblies Whitepaper](https://whitepaper.evefrontier.com/digital-physics/smart-assemblies)
- [Sui Move Concepts](https://docs.sui.io/concepts/sui-move-concepts)
- [Sui Trustless Swap (Escrow Pattern)](https://docs.sui.io/guides/developer/app-examples/trustless-swap)
- [Sui shared_escrow.move Example](https://github.com/MystenLabs/sui/blob/main/sui_programmability/examples/defi/sources/shared_escrow.move)
- [Sui Events Documentation](https://docs.sui.io/guides/developer/accessing-data/using-events)
- [Move Events Guide](https://move-book.com/programmability/events.html)
- [Sui dApp Kit Documentation](https://sdk.mystenlabs.com/dapp-kit)
- [useSignAndExecuteTransaction Hook](https://sdk.mystenlabs.com/dapp-kit/wallet-hooks/useSignAndExecuteTransaction)
- [Build React Apps on Sui](https://blog.sui.io/react-apps-dapp-kit/)
- [Builder Examples (GitHub)](https://github.com/projectawakening/builder-examples)
- [Getting Started with Smart Infrastructure](https://dev.to/q9/getting-started-with-smart-infrastructure-in-eve-frontier-45n4)








