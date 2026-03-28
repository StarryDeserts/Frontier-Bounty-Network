import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { requireFrontendConfig } from '@/config/constants';
import { AddressTag } from '@/components/common/AddressTag';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useRegisterGate } from '@/hooks/contract/useRegisterGate';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';
import { useWantedList } from '@/hooks/query/useWantedList';
import { shortenAddress } from '@/utils/address';
import { formatSuiFromMist } from '@/utils/format';

type GatePolicyMode = 0 | 1 | 2;

const policyOptions: Array<{
  mode: GatePolicyMode;
  label: string;
  effect: string;
  description: string;
  accent: string;
}> = [
  {
    mode: 1,
    label: 'SURCHARGE',
    effect: 'Wanted pilots can still transit, but must pay a penalty to cross the gate.',
    description:
      'Best demo path. It shows a live on-chain policy object while staying readable as a player-facing fee or deterrence mechanic.',
    accent: 'border-amber/30 bg-amber/10 text-amber',
  },
  {
    mode: 2,
    label: 'ALERT_ONLY',
    effect: 'Gate stays open, but operators get a wanted-triggered alert for downstream response.',
    description:
      'Good for softer infrastructure control. It frames the gate as a routing sensor and escalation point.',
    accent: 'border-frost/35 bg-frost/10 text-ice',
  },
  {
    mode: 0,
    label: 'BLOCK',
    effect: 'Wanted pilots above the reward threshold are denied passage.',
    description:
      'Most aggressive mode. Useful for showing a future `canJump` denial surface, but harsher than most judge demos need.',
    accent: 'border-crimson/35 bg-crimson/10 text-crimson',
  },
];

function getTxDigest(result: unknown): string | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const value = result as {
    digest?: string;
    effects?: { transactionDigest?: string };
  };

  return value.digest ?? value.effects?.transactionDigest ?? null;
}

function evaluatePolicy(mode: GatePolicyMode, wantedReward: number, thresholdMist: bigint) {
  const threshold = Number(thresholdMist);
  const aboveThreshold = wantedReward >= threshold;

  if (!aboveThreshold) {
    return {
      hookCode: 0,
      label: 'ALLOW',
      detail: 'Target reward is below threshold. Gate extension would allow the jump.',
      cls: 'border-mint/35 bg-mint/10 text-mint',
    };
  }

  if (mode === 0) {
    return {
      hookCode: 1,
      label: 'BLOCK',
      detail: 'Target is wanted above threshold. Gate extension would deny passage.',
      cls: 'border-crimson/35 bg-crimson/10 text-crimson',
    };
  }

  if (mode === 1) {
    return {
      hookCode: 2,
      label: 'SURCHARGE',
      detail: 'Target is wanted above threshold. Gate extension would require a fee before transit.',
      cls: 'border-amber/35 bg-amber/10 text-amber',
    };
  }

  return {
    hookCode: 3,
    label: 'ALERT_ONLY',
    detail: 'Target is wanted above threshold. Gate extension would emit an alert and allow passage.',
    cls: 'border-frost/35 bg-frost/10 text-ice',
  };
}

export default function SmartGateDemoPage() {
  const config = requireFrontendConfig();
  const mode = useDataSourceMode();
  const account = useCurrentAccount();
  const { wanted, isLoading, isError, error } = useWantedList();
  const registerGate = useRegisterGate();
  const [searchParams] = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<GatePolicyMode>(1);
  const [minThresholdMist, setMinThresholdMist] = useState('25000000');
  const [surchargeMist, setSurchargeMist] = useState('5000000');
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tenant = searchParams.get('tenant') ?? '';
  const itemId = searchParams.get('itemId') ?? '';
  const selectedTarget = wanted[0] ?? null;
  const thresholdMist = BigInt(minThresholdMist || '0');
  const surchargeValue = BigInt(surchargeMist || '0');
  const preview = evaluatePolicy(selectedMode, selectedTarget?.totalReward ?? 0, thresholdMist);
  const selectedPolicy = policyOptions.find((option) => option.mode === selectedMode) ?? policyOptions[0];

  const recommendedEntry = useMemo(() => {
    const params = new URLSearchParams();
    if (tenant) {
      params.set('tenant', tenant);
    } else {
      params.set('tenant', 'smart-gate-demo');
    }
    if (itemId) {
      params.set('itemId', itemId);
    } else {
      params.set('itemId', config.bountyBoardId);
    }
    return `/smart-gate-demo?${params.toString()}`;
  }, [config.bountyBoardId, itemId, tenant]);

  async function handleRegisterGate() {
    setSubmitError(null);
    setTxDigest(null);

    try {
      const result = await registerGate.mutateAsync({
        mode: selectedMode,
        surcharge: surchargeValue,
        minThreshold: thresholdMist,
      });
      setTxDigest(getTxDigest(result));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gate policy transaction failed.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="panel overflow-hidden p-6">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div>
            <p className="eyebrow">EVE Frontier Smart Gate Demo Slice</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl text-ice md:text-4xl">Wanted players trigger Smart Gate policy</h1>
              {mode.data && <ModeBadge mode={mode.data.mode} />}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted md:text-base">
              This page frames Frontier Bounty Network as a Smart Infrastructure policy layer. The live on-chain part is the gate policy object and the wanted state.
              The staged part is the future game-side hook that would feed the same decision into Smart Gate `canJump` style runtime checks.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
                <p className="label-muted">Why this matters</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Gates become programmable infrastructure: wanted pilots can be blocked, surcharged, or flagged for downstream interception.
                </p>
              </div>
              <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
                <p className="label-muted">Builder-style entry</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Optional `tenant` and `itemId` query params make this page easier to drop into an assembly-oriented demo route without reworking the whole app.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
              <p className="label-muted">Recommended route entry</p>
              <p className="mt-2 break-all font-mono text-xs text-ice">{recommendedEntry}</p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
              <p className="label-muted">Tenant</p>
              <p className="mt-2 font-mono text-xs text-ice">{tenant || 'smart-gate-demo'}</p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
              <p className="label-muted">Item ID</p>
              <p className="mt-2 break-all font-mono text-xs text-ice">{itemId || config.bountyBoardId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-5">
          <div className="panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Policy surface</p>
                <h2 className="mt-2 font-display text-2xl text-ink">Smart Gate policy modes</h2>
              </div>
              <span className="rounded-full border border-line/70 bg-steel/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Smart Gate custom extension / permit model
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {policyOptions.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setSelectedMode(option.mode)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedMode === option.mode
                      ? option.accent
                      : 'border-line/60 bg-steel/45 text-ink hover:border-frost/25'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{option.effect}</p>
                    </div>
                    {selectedMode === option.mode && (
                      <span className="rounded-full border border-current/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                        selected
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <p className="eyebrow">Live wanted input</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Wanted player signal</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              The demo uses current bounty state as the gate policy input. In chain-direct mode this is derived from recent live bounty objects and events, so judges can still see the slice without an indexer.
            </p>

            <div className="mt-5 min-h-[14rem]">
              {isLoading ? (
                <LoadingSpinner label="Resolving live wanted targets..." />
              ) : isError ? (
                <EmptyState
                  title="Wanted view unavailable"
                  description={`The current data path could not resolve active bounty targets${error instanceof Error ? `: ${error.message}` : '.'}`}
                />
              ) : wanted.length === 0 ? (
                <EmptyState
                  title="No wanted pilots in current window"
                  description="Create a bounty first, then return here. In chain-direct mode the page intentionally scans a bounded recent window."
                />
              ) : (
                <div className="space-y-3">
                  {wanted.slice(0, 5).map((entry, index) => {
                    const state = evaluatePolicy(selectedMode, entry.totalReward, thresholdMist);
                    return (
                      <div
                        key={entry.address}
                        className={`rounded-3xl border p-4 ${index === 0 ? state.cls : 'border-line/60 bg-steel/45'}`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="label-muted">Wanted target</p>
                            <div className="mt-2">
                              <AddressTag address={entry.address} />
                            </div>
                          </div>
                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <p className="label-muted">Visible reward</p>
                              <p className="mt-2 font-semibold text-amber">{formatSuiFromMist(entry.totalReward)}</p>
                            </div>
                            <div>
                              <p className="label-muted">Gate result</p>
                              <p className="mt-2 font-semibold text-ink">{state.label}</p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted">{state.detail}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel p-5">
            <p className="eyebrow">Demo operator console</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Register gate policy on-chain</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              This uses the same dApp-kit sign-and-execute flow as the rest of the app. Recommended judge path is SURCHARGE because it demonstrates a concrete deterrence mechanic without needing a full live gate runtime.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="label-muted">Minimum wanted threshold (mist)</span>
                <input
                  className="control-input mt-2"
                  value={minThresholdMist}
                  onChange={(event) => setMinThresholdMist(event.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                />
              </label>
              <label className="block text-sm">
                <span className="label-muted">Surcharge amount (mist)</span>
                <input
                  className="control-input mt-2"
                  value={surchargeMist}
                  onChange={(event) => setSurchargeMist(event.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  disabled={selectedMode !== 1}
                />
              </label>
            </div>

            <div className="mt-5 rounded-3xl border border-line/60 bg-steel/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-muted">Current preview</p>
                  <p className="mt-2 font-display text-lg text-ice">{selectedPolicy.label}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${preview.cls}`}>
                  hook result {preview.hookCode}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{preview.detail}</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="label-muted">Threshold</p>
                  <p className="mt-2 text-ink">{formatSuiFromMist(Number(thresholdMist))}</p>
                </div>
                <div>
                  <p className="label-muted">Surcharge</p>
                  <p className="mt-2 text-ink">{selectedMode === 1 ? formatSuiFromMist(Number(surchargeValue)) : 'Not applied'}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!account || registerGate.isPending}
              onClick={handleRegisterGate}
            >
              {registerGate.isPending ? 'Submitting gate policy...' : 'Register Smart Gate policy'}
            </button>
            {!account && (
              <p className="mt-3 text-xs leading-5 text-muted">
                Connect a wallet first. For judge demos in an external browser, EV Vault is the recommended EVE Frontier wallet path.
              </p>
            )}
            {submitError && (
              <p className="mt-3 rounded-2xl border border-crimson/35 bg-crimson/10 px-4 py-3 text-sm text-crimson">
                {submitError}
              </p>
            )}
            {txDigest && (
              <div className="mt-3 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3">
                <p className="label-muted">Gate policy tx digest</p>
                <p className="mt-2 break-all font-mono text-xs text-mint">{txDigest}</p>
              </div>
            )}
          </div>

          <div className="panel p-5">
            <p className="eyebrow">What is live vs staged</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-mint/30 bg-mint/10 p-4">
                <p className="font-semibold text-mint">Live / chain-backed now</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Wanted state from the bounty board, wallet-triggered `register_bounty_gate`, and direct transaction signing through the browser wallet.
                </p>
              </div>
              <div className="rounded-2xl border border-amber/30 bg-amber/10 p-4">
                <p className="font-semibold text-amber">Staged integration</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  The actual Smart Gate runtime hook. Today this page demonstrates the policy surface and the expected result that a future `canJump` extension would consume.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-muted">
              <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
                <p className="label-muted">Package</p>
                <p className="mt-2 font-mono text-xs text-ice">{shortenAddress(config.packageId, 10)}</p>
              </div>
              <div className="rounded-2xl border border-line/60 bg-steel/45 p-4">
                <p className="label-muted">Bounty board singleton</p>
                <p className="mt-2 font-mono text-xs text-ice">{shortenAddress(config.bountyBoardId, 10)}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/publish" className="button-secondary">
                Publish a bounty first
              </Link>
              <Link to="/bounties" className="button-secondary">
                Open Bounty Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
