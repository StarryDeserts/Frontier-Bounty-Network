import { useCurrentAccount } from '@mysten/dapp-kit';

import { useRegisterHunter } from '@/hooks/contract/useRegisterHunter';

export default function Settings() {
  const account = useCurrentAccount();
  const { registerHunter, isPending } = useRegisterHunter();

  return (
    <div className="panel p-5">
      <p className="eyebrow">Operator Actions</p>
      <h2 className="mt-2 font-display text-xl text-ink">Wallet-triggered actions</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Registering a hunter badge is a direct on-chain action and remains available even when the frontend is running without an indexer.
      </p>
      <button
        className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending || !account}
        onClick={() => registerHunter()}
      >
        {isPending ? 'Submitting...' : 'Register Hunter Badge'}
      </button>
    </div>
  );
}
