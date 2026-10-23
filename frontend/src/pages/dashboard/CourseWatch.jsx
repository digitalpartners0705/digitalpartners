import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCourse, getPlayUrl, recordWatchTime } from '../../services/courses'
import { canViewCourse } from '../../utils/courses'

function CourseWatch() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [videos, setVideos] = useState([])
  const [status, setStatus] = useState('loading')
  const [activeId, setActiveId] = useState(null)
  const [playUrl, setPlayUrl] = useState('')
  const videoRef = useRef(null)
  const watchRef = useRef({ lastTime: null, pending: 0 })

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setCourse(null)
    setVideos([])
    setActiveId(null)

    getCourse(courseId)
      .then((data) => {
        if (cancelled) return
        if (!canViewCourse(data.course, user)) {
          setStatus('locked')
          return
        }
        setCourse(data.course)
        setVideos(data.lessons || [])
        setActiveId(data.lessons?.[0]?.id || null)
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setStatus(error.response?.status === 404 ? 'missing' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [courseId, user])

  useEffect(() => {
    if (status !== 'ready' || !activeId) return undefined
    let cancelled = false
    setPlayUrl('')

    getPlayUrl(courseId, activeId)
      .then((data) => {
        if (!cancelled) setPlayUrl(data.url || '')
      })
      .catch(() => {
        if (!cancelled) setPlayUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [activeId, courseId, status])

  useEffect(() => {
    watchRef.current = { lastTime: null, pending: 0 }
  }, [activeId])

  useEffect(() => {
    const flush = (keepalive = false) => {
      const pending = Math.floor(watchRef.current.pending)
      if (pending < 1 || !courseId || !activeId) return
      watchRef.current.pending -= pending
      recordWatchTime(courseId, activeId, pending, { keepalive }).catch(() => {
        if (!keepalive) watchRef.current.pending += pending
      })
    }

    const onTime = () => {
      const video = videoRef.current
      if (!video || video.paused || video.seeking) return
      const now = video.currentTime
      const last = watchRef.current.lastTime
      watchRef.current.lastTime = now
      if (last == null) return
      const delta = now - last
      if (delta > 0 && delta < 2) {
        watchRef.current.pending += delta
      }
      if (watchRef.current.pending >= 10) flush(false)
    }

    const onSeeking = () => {
      watchRef.current.lastTime = videoRef.current?.currentTime ?? null
    }

    const onLeave = () => flush(true)
    const video = videoRef.current
    if (video) {
      video.addEventListener('timeupdate', onTime)
      video.addEventListener('seeking', onSeeking)
      video.addEventListener('pause', onLeave)
      video.addEventListener('ended', onLeave)
    }
    window.addEventListener('pagehide', onLeave)

    return () => {
      if (video) {
        video.removeEventListener('timeupdate', onTime)
        video.removeEventListener('seeking', onSeeking)
        video.removeEventListener('pause', onLeave)
        video.removeEventListener('ended', onLeave)
      }
      window.removeEventListener('pagehide', onLeave)
      flush(true)
    }
  }, [activeId, courseId, playUrl])

  if (status === 'missing' || status === 'locked') {
    return <Navigate to={status === 'locked' ? '/dashboard/upgrade' : '/dashboard/browse'} replace />
  }

  if (status === 'loading') {
    return <p className="text-sm text-slate-500">Loading course...</p>
  }

  if (status === 'error' || !course) {
    return <p className="text-sm text-red-600">Could not load this course.</p>
  }

  const activeVideo = videos.find((video) => video.id === activeId) || videos[0]
  const certificateTo = `/dashboard/certificates?course=${encodeURIComponent(course.id)}`

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">{course.tag}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {course.instructor} · {videos.length} videos
          </p>
        </div>
        <Link
          to={certificateTo}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="5" />
            <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" strokeLinejoin="round" />
          </svg>
          Get certificate
        </Link>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_20rem]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="aspect-video bg-[#111827]">
            {playUrl ? (
              <video
                key={activeVideo?.id}
                ref={videoRef}
                className="h-full w-full bg-black"
                controls
                playsInline
                src={playUrl}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-300">
                {activeVideo?.hasVideo ? 'Loading video...' : 'No video uploaded for this lesson yet'}
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Lesson {videos.findIndex((video) => video.id === activeVideo?.id) + 1} of {videos.length}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{activeVideo?.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{course.description}</p>
          </div>
        </section>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-slate-900">Lessons</h2>
            <p className="mt-0.5 text-xs text-slate-500">{videos.length} in this course</p>
          </div>
          <ol className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
            {videos.map((video, index) => {
              const isActive = video.id === activeVideo?.id
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(video.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                      isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-slate-900'}`}>
                        {video.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{video.duration}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
    </div>
  )
}

export default CourseWatch
