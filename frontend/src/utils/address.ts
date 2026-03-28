export function shortenAddress(address: string, size = 4): string {
  if (!address || address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}...${address.slice(-size)}`;
}
