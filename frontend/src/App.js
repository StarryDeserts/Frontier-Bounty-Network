import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
import { FRONTEND_CONFIG_DIAGNOSTICS } from '@/config/constants';
import { ConfigErrorScreen } from '@/components/common/ConfigErrorScreen';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import DashboardPage from '@/pages/Dashboard';
import BountyBoardPage from '@/pages/BountyBoard';
import BountyDetailPage from '@/pages/BountyDetail';
import PublishBountyPage from '@/pages/PublishBounty';
import HunterRankingPage from '@/pages/HunterRanking';
import MyProfilePage from '@/pages/MyProfile';
import SmartGateDemoPage from '@/pages/SmartGateDemo';
export default function App() {
    if (!FRONTEND_CONFIG_DIAGNOSTICS.isValid) {
        return _jsx(ConfigErrorScreen, { diagnostics: FRONTEND_CONFIG_DIAGNOSTICS });
    }
    return (_jsxs("div", { className: "relative min-h-screen overflow-x-hidden text-ink", children: [_jsx(Header, {}), _jsxs("div", { className: "mx-auto flex w-full max-w-[1500px] gap-6 px-4 pb-10 pt-6 md:px-6 xl:px-8", children: [_jsx(Sidebar, {}), _jsx("main", { className: "panel min-h-[72vh] flex-1 p-5 md:p-7 xl:p-8", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/bounties", element: _jsx(BountyBoardPage, {}) }), _jsx(Route, { path: "/bounties/:id", element: _jsx(BountyDetailPage, {}) }), _jsx(Route, { path: "/publish", element: _jsx(PublishBountyPage, {}) }), _jsx(Route, { path: "/hunters", element: _jsx(HunterRankingPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(MyProfilePage, {}) }), _jsx(Route, { path: "/smart-gate-demo", element: _jsx(SmartGateDemoPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }), _jsx(Footer, {})] }));
}
