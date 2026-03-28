export function shortenAddress(address, size = 4) {
    if (!address || address.length <= size * 2 + 2)
        return address;
    return `${address.slice(0, size + 2)}...${address.slice(-size)}`;
}
