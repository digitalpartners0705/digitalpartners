import { useEffect, useState } from 'react'
import { getTrainingPlayUrl, getTrainings } from '../../services/api'

function PlayMark({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}

function AffiliateTrainings() {
  const [days, setDays] = useState([])
  const [dayId, setDayId] = useState(null)
  const [videoId, setVideoId] = useState(null)
  const [playUrl, setPlayUrl] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    getTrainings()
      .then((data) => {
        const nextDays = data.days || []
        setDays(nextDays)
        setDayId(nextDays[0]?.id || null)
        setVideoId(nextDays[0]?.videos?.[0]?.id || null)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load trainings')
        setStatus('error')
      })
  }, [])

  const day = days.find((item) => item.id === dayId) || days[0]
  const videos = day?.videos || []
  const videoIndex = Math.max(0, videos.findIndex((item) => item.id === videoId))
  const video = videos[videoIndex] || null
  const dayIndex = days.findIndex((item) => item.id === day?.id)

  useEffect(() => {
    if (!day?.id || !video?.id || !video.hasVideo) {
      setPlayUrl('')
      return undefined
    }
    let cancelled = false
    setPlayUrl('')
    getTrainingPlayUrl(day.id, video.id)
      .then((data) => {
        if (!cancelled) setPlayUrl(data.url || '')
      })
      .catch(() => {
        if (!cancelled) setPlayUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [day?.id, video?.id, video?.hasVideo])

  const openDay = (next) => {
    setDayId(next.id)
    setVideoId(next.videos?.[0]?.id || null)
  }

  const openVideo = (offset) => {
    const next = videos[videoIndex + offset]
    if (next) setVideoId(next.id)
  }

  if (status === 'loading') {
    return <p className="text-sm text-slate-400">Loading trainings...</p>
  }

  if (status === 'error') {
    return <p className="text-sm text-red-300">{error}</p>
  }

  if (!day) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="text-lg font-semibold text-white">No training days are published yet.</p>
        <p className="mt-2 text-sm text-slate-400">Published days will show up here.</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-6 text-slate-100 sm:-mx-8 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Trainings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Day {day.dayNumber} of {days.length}
            <span className="mx-2 text-slate-600">·</span>
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#171b27] px-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-300 text-xs font-bold text-slate-900">
            {String(day.dayNumber).padStart(2, '0')}
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current day</span>
            <span className="mt-0.5 block max-w-[12rem] truncate text-sm font-semibold text-white">{day.title}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#171b27] px-2 py-4 sm:px-3">
        <div className="flex min-w-max">
          {days.map((item, index) => {
            const selected = item.id === day.id
            const reached = index <= dayIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openDay(item)}
                className="group flex w-[6.75rem] cursor-pointer flex-col items-center sm:w-auto sm:min-w-[6.5rem] sm:flex-1"
              >
                <span className="flex w-full items-center">
                  <span className={`h-0.5 flex-1 rounded-full ${index === 0 ? 'bg-transparent' : reached ? 'bg-teal-300' : 'bg-white/10'}`} />
                  <span
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      selected
                        ? 'bg-teal-300 text-slate-900 ring-4 ring-teal-300/25'
                        : reached
                          ? 'bg-teal-300/15 text-teal-200 ring-1 ring-teal-300/50 group-hover:bg-teal-300/25'
                          : 'bg-[#10131c] text-slate-400 ring-1 ring-white/15 group-hover:text-white group-hover:ring-white/30'
                    }`}
                  >
                    {String(item.dayNumber).padStart(2, '0')}
                  </span>
                  <span
                    className={`h-0.5 flex-1 rounded-full ${
                      index === days.length - 1 ? 'bg-transparent' : index < dayIndex ? 'bg-teal-300' : 'bg-white/10'
                    }`}
                  />
                </span>
                <span
                  className={`mt-2 line-clamp-2 px-1 text-center text-[11px] font-semibold leading-4 ${
                    selected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
          <div className="relative aspect-video max-h-[28rem] w-full bg-[#07090e]">
            {playUrl ? (
              <video key={video.id} className="h-full w-full bg-black object-contain" controls playsInline src={playUrl} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.18),transparent_58%)] px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-300 text-slate-900">
                  <PlayMark />
                </span>
                <p className="mt-4 text-sm font-semibold text-white">
                  {video ? 'This video is not ready yet' : 'No videos on this day'}
                </p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                  {video ? `${video.title} will play here once the file is added.` : 'Videos added for this day will appear in the playlist.'}
                </p>
              </div>
            )}
          </div>

          {video ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">
                  Video {videoIndex + 1} of {videos.length}
                </p>
                <h2 className="mt-1 truncate text-lg font-bold tracking-tight">{video.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{video.duration}</span>
                <button
                  type="button"
                  onClick={() => openVideo(-1)}
                  disabled={videoIndex <= 0}
                  className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => openVideo(1)}
                  disabled={videoIndex >= videos.length - 1}
                  className="cursor-pointer rounded-lg bg-teal-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 text-sm text-slate-500">Pick another day to continue.</div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Day {day.dayNumber} playlist</h2>
              <span className="text-xs font-medium text-slate-500">{dayIndex + 1}/{days.length}</span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">{day.title}</p>
          </div>
          {videos.length === 0 ? (
            <p className="px-4 py-10 text-sm text-slate-500">No videos on this day yet.</p>
          ) : (
            <ol className="flex-1 overflow-y-auto">
              {videos.map((item, index) => {
                const selected = item.id === video?.id
                return (
                  <li key={item.id} className="border-b border-white/5 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setVideoId(item.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3.5 text-left ${
                        selected ? 'border-teal-300 bg-teal-300/10' : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          selected ? 'bg-teal-300 text-slate-900' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {selected ? <PlayMark className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-semibold ${selected ? 'text-white' : 'text-slate-100'}`}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {item.hasVideo ? 'Ready to play' : 'No video yet'}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${selected ? 'bg-teal-300/20 text-teal-100' : 'bg-white/5 text-slate-400'}`}>
                        {item.duration}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </aside>
      </div>
    </div>
  )
}

export default AffiliateTrainings
