import { useState } from 'react';

import { MIST_PER_SUI } from '@/config/constants';
import { ModeBadge } from '@/components/common/ModeBadge';
import { useCreateBounty } from '@/hooks/contract/useCreateBounty';
import { useDataSourceMode } from '@/hooks/query/useDataSourceMode';

import BountyForm, { type PublishFormState } from './BountyForm';
import ConfirmDialog from './ConfirmDialog';
import CostPreview from './CostPreview';

export default function PublishBountyPage() {
  const [form, setForm] = useState<PublishFormState>({
    target: '',
    rewardSui: '1',
    durationHours: 24,
    description: '',
  });
  const [confirming, setConfirming] = useState(false);
  const { createBounty, isPending } = useCreateBounty();
  const mode = useDataSourceMode();

  const rewardMist = BigInt(Math.floor(Number(form.rewardSui || '0') * MIST_PER_SUI));

  const submit = async () => {
    await createBounty({
      target: form.target,
      rewardAmount: rewardMist,
      durationHours: form.durationHours,
      description: form.description,
    });
    setConfirming(false);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Mission Publication</p>
          <h1 className="mt-2 font-display text-3xl text-ice">Publish Bounty</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Read mode does not affect writes. Even on a static site with no indexer, this flow still builds and signs a live Sui transaction through the connected wallet.
          </p>
        </div>
        {mode.data && <ModeBadge mode={mode.data.mode} />}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <BountyForm form={form} onChange={setForm} onSubmit={() => setConfirming(true)} />
        <CostPreview rewardMist={Number(rewardMist)} />
      </div>
      <ConfirmDialog
        open={confirming}
        isPending={isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={submit}
      />
    </section>
  );
}
