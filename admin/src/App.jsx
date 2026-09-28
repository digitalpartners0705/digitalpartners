import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CourseEditor from './pages/CourseEditor'
import CourseLessons from './pages/CourseLessons'
import CoursesPage from './pages/CoursesPage'
import TrainingEditor from './pages/TrainingEditor'
import TrainingVideos from './pages/TrainingVideos'
import TrainingsPage from './pages/TrainingsPage'
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
        <Route index element={<Navigate to="courses" replace />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/new" element={<CourseEditor />} />
        <Route path="courses/:id/edit" element={<CourseEditor />} />
        <Route path="courses/:id" element={<CourseLessons />} />
        <Route path="trainings" element={<TrainingsPage />} />
        <Route path="trainings/new" element={<Navigate to="/trainings" replace />} />
        <Route path="trainings/:id/edit" element={<TrainingEditor />} />
        <Route path="trainings/:id" element={<TrainingVideos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
