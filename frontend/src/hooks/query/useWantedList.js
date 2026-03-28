import { useMemo } from 'react';
import { useBounties } from './useBounties';
export function useWantedList() {
    const query = useBounties({ status: 0, pageSize: 100 });
    const wanted = useMemo(() => {
        const map = new Map();
        for (const bounty of query.data ?? []) {
            map.set(bounty.target, (map.get(bounty.target) ?? 0) + bounty.rewardAmount);
        }
        return Array.from(map.entries())
            .map(([address, totalReward]) => ({ address, totalReward }))
            .sort((a, b) => b.totalReward - a.totalReward);
    }, [query.data]);
    return { ...query, wanted };
}
