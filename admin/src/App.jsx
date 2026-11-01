import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CourseEditor from './pages/CourseEditor'
import CourseLessons from './pages/CourseLessons'
import CoursesPage from './pages/CoursesPage'
import CommissionsPage from './pages/CommissionsPage'
import EarnerDetail from './pages/EarnerDetail'
import OrderDetail from './pages/OrderDetail'
import OrderRequestsPage from './pages/OrderRequestsPage'
import OrdersPage from './pages/OrdersPage'
import TrainingEditor from './pages/TrainingEditor'
import TrainingVideos from './pages/TrainingVideos'
import TrainingsPage from './pages/TrainingsPage'
import ContactRequestsPage from './pages/ContactRequestsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AchievementsPage from './pages/AchievementsPage'
import KycPage from './pages/KycPage'
import Login from './pages/Login'
import { getToken } from './services/api'

function RequireAdmin({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="order-requests" element={<OrderRequestsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="commissions" element={<CommissionsPage />} />
        <Route path="commissions/earners/:userId" element={<EarnerDetail />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/new" element={<CourseEditor />} />
        <Route path="courses/:id/edit" element={<CourseEditor />} />
        <Route path="courses/:id" element={<CourseLessons />} />
        <Route path="trainings" element={<TrainingsPage />} />
        <Route path="trainings/new" element={<Navigate to="/trainings" replace />} />
        <Route path="trainings/:id/edit" element={<TrainingEditor />} />
        <Route path="trainings/:id" element={<TrainingVideos />} />
        <Route path="contact" element={<ContactRequestsPage />} />
        <Route path="contact-requests" element={<ContactRequestsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="kyc" element={<KycPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
