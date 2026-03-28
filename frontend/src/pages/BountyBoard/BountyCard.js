import { jsx as _jsx } from "react/jsx-runtime";
import { WantedPoster } from '@/components/bounty/WantedPoster';
export default function BountyCard({ bounty }) {
    return _jsx(WantedPoster, { bounty: bounty });
}
