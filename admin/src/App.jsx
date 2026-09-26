import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import CourseEditor from './pages/CourseEditor'
import CoursesPage from './pages/CoursesPage'
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
        <Route index element={<CoursesPage />} />
        <Route path="courses/new" element={<CourseEditor />} />
        <Route path="courses/:id" element={<CourseEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
