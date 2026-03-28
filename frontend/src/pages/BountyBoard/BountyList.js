import { jsx as _jsx } from "react/jsx-runtime";
import BountyCard from './BountyCard';
export default function BountyList({ bounties }) {
    return (_jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: bounties.map((bounty) => (_jsx(BountyCard, { bounty: bounty }, bounty.id))) }));
}
