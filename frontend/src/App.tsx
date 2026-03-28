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
    return <ConfigErrorScreen diagnostics={FRONTEND_CONFIG_DIAGNOSTICS} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-ink">
      <Header />
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-4 pb-10 pt-6 md:px-6 xl:px-8">
        <Sidebar />
        <main className="panel min-h-[72vh] flex-1 p-5 md:p-7 xl:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/bounties" element={<BountyBoardPage />} />
            <Route path="/bounties/:id" element={<BountyDetailPage />} />
            <Route path="/publish" element={<PublishBountyPage />} />
            <Route path="/hunters" element={<HunterRankingPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/smart-gate-demo" element={<SmartGateDemoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}
