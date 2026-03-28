export default function ConfirmDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md p-5">
        <p className="eyebrow">Wallet Action Required</p>
        <h3 className="mt-2 font-display text-xl text-ink">Confirm transaction</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          The wallet will open for signing. Reward funds are transferred into escrow as part of the bounty creation call.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="button-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Submitting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
