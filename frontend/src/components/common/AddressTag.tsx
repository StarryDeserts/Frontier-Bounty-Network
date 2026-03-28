import { shortenAddress } from '@/utils/address';

export function AddressTag({ address }: { address: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line/80 bg-graphite/80 px-3 py-1 font-mono text-xs text-ice/90 shadow-glow">
      {shortenAddress(address, 6)}
    </span>
  );
}
