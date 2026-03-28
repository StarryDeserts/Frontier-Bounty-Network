export interface PublishFormState {
  target: string;
  rewardSui: string;
  durationHours: number;
  description: string;
}

export default function BountyForm({
  form,
  onChange,
  onSubmit,
}: {
  form: PublishFormState;
  onChange: (next: PublishFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <p className="eyebrow">Mission Composer</p>
        <h2 className="mt-2 font-display text-xl text-ink">Create a live bounty</h2>
      </div>
      <label className="block text-sm text-muted">
        <span className="mb-2 block label-muted">Target Address</span>
        <input
          required
          className="control-input"
          value={form.target}
          onChange={(e) => onChange({ ...form, target: e.target.value })}
        />
      </label>
      <label className="block text-sm text-muted">
        <span className="mb-2 block label-muted">Reward (SUI)</span>
        <input
          required
          type="number"
          min="0.001"
          step="0.001"
          className="control-input"
          value={form.rewardSui}
          onChange={(e) => onChange({ ...form, rewardSui: e.target.value })}
        />
      </label>
      <label className="block text-sm text-muted">
        <span className="mb-2 block label-muted">Duration (hours)</span>
        <input
          required
          type="number"
          min={1}
          className="control-input"
          value={form.durationHours}
          onChange={(e) => onChange({ ...form, durationHours: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm text-muted">
        <span className="mb-2 block label-muted">Mission Brief</span>
        <textarea
          className="control-textarea"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </label>
      <button className="button-primary w-full">Review & Submit</button>
    </form>
  );
}
