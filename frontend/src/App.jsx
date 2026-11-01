import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { hasSubscription } from './utils/subscription'
import AffiliateLayout from './components/AffiliateLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AffiliateAchievements from './pages/affiliate/AffiliateAchievements'
import AffiliateAnnouncements from './pages/affiliate/AffiliateAnnouncements'
import AffiliateCommunity from './pages/affiliate/AffiliateCommunity'
import AffiliateEarnings from './pages/affiliate/AffiliateEarnings'
import AffiliateLeaderboard from './pages/affiliate/AffiliateLeaderboard'
import AffiliateLinks from './pages/affiliate/AffiliateLinks'
import AffiliateCommission from './pages/affiliate/AffiliateCommission'
import AffiliateRefInfo from './pages/affiliate/AffiliateRefInfo'
import AffiliateKyc from './pages/affiliate/AffiliateKyc'
import AffiliateProfile from './pages/affiliate/AffiliateProfile'
import AffiliateSection from './pages/affiliate/AffiliateSection'
import AffiliateTrainings from './pages/affiliate/AffiliateTrainings'
import BrowseCourses from './pages/dashboard/BrowseCourses'
import Certificates from './pages/dashboard/Certificates'
import CourseWatch from './pages/dashboard/CourseWatch'
import DashboardHome from './pages/dashboard/DashboardHome'
import MyCourses from './pages/dashboard/MyCourses'
import RecentUpdates from './pages/dashboard/RecentUpdates'
import Upgrade from './pages/dashboard/Upgrade'
import Join from './pages/Join'
import Landing from './pages/Landing'
import About from './pages/About'
import Contact from './pages/Contact'
import PackageDetail from './pages/PackageDetail'

function RequireSubscription({ children }) {
  const { user } = useAuth()
  if (!hasSubscription(user)) return <Navigate to="/dashboard/upgrade" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/packages/:packageId" element={<PackageDetail />} />
      <Route path="/join" element={<Join />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="courses" element={<MyCourses />} />
        <Route path="courses/:courseId" element={<CourseWatch />} />
        <Route path="browse" element={<BrowseCourses />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="updates" element={<RecentUpdates />} />
        <Route path="community" element={<RecentUpdates />} />
        <Route path="upgrade" element={<Upgrade />} />
      </Route>
      <Route
        path="/affiliate"
        element={
          <ProtectedRoute>
            <RequireSubscription>
              <AffiliateLayout />
            </RequireSubscription>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="earnings" replace />} />
        <Route path="profile" element={<AffiliateProfile />} />
        <Route path="earnings" element={<AffiliateEarnings />} />
        {/* Downloads temporarily hidden — restore AffiliateDownloads when kits are ready */}
        <Route path="downloads" element={<Navigate to="/affiliate/earnings" replace />} />
        <Route path="announcements" element={<AffiliateAnnouncements />} />
        <Route path="trainings" element={<AffiliateTrainings />} />
        <Route path="leaderboard" element={<AffiliateLeaderboard />} />
        <Route path="kyc" element={<AffiliateKyc />} />
        <Route path="links" element={<AffiliateLinks />} />
        <Route path="commission" element={<AffiliateCommission />} />
        <Route path="ref-info" element={<AffiliateRefInfo />} />
        <Route path="achievements" element={<AffiliateAchievements />} />
        <Route path="community" element={<AffiliateCommunity />} />
      </Route>
    </Routes>
  )
}

export default App
