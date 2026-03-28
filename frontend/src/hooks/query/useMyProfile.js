import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBounties } from './useBounties';
import { useHunterProfile } from './useHunterProfile';
export function useMyProfile() {
    const account = useCurrentAccount();
    const address = account?.address;
    const hunter = useHunterProfile(address);
    const published = useBounties({ creator: address, pageSize: 20 });
    return {
        address,
        hunter,
        published,
    };
}
