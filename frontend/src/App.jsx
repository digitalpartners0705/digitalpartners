import { Navigate, Route, Routes } from 'react-router-dom'
import AffiliateLayout from './components/AffiliateLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AffiliateAchievements from './pages/affiliate/AffiliateAchievements'
import AffiliateAnnouncements from './pages/affiliate/AffiliateAnnouncements'
import AffiliateCommunity from './pages/affiliate/AffiliateCommunity'
import AffiliateDownloads from './pages/affiliate/AffiliateDownloads'
import AffiliateEarnings from './pages/affiliate/AffiliateEarnings'
import AffiliateLeaderboard from './pages/affiliate/AffiliateLeaderboard'
import AffiliateRefInfo from './pages/affiliate/AffiliateRefInfo'
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
import Landing from './pages/Landing'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
        <Route path="upgrade" element={<Upgrade />} />
      </Route>
      <Route
        path="/affiliate"
        element={
          <ProtectedRoute>
            <AffiliateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="earnings" replace />} />
        <Route path="profile" element={<AffiliateProfile />} />
        <Route path="earnings" element={<AffiliateEarnings />} />
        <Route path="downloads" element={<AffiliateDownloads />} />
        <Route path="announcements" element={<AffiliateAnnouncements />} />
        <Route path="trainings" element={<AffiliateTrainings />} />
        <Route path="leaderboard" element={<AffiliateLeaderboard />} />
        <Route path="kyc" element={<AffiliateSection />} />
        <Route path="links" element={<AffiliateSection />} />
        <Route path="ref-info" element={<AffiliateRefInfo />} />
        <Route path="qualification" element={<AffiliateSection />} />
        <Route path="achievements" element={<AffiliateAchievements />} />
        <Route path="community" element={<AffiliateCommunity />} />
      </Route>
    </Routes>
  )
}

export default App
