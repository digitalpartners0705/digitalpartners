import { useEffect, useState } from 'react'
import { getCatalog } from '../services/courses'

export function useCatalog() {
  const [catalog, setCatalog] = useState({
    courses: [],
    categories: ['All'],
    packages: [],
    loading: true,
    error: '',
  })

  useEffect(() => {
    let cancelled = false

    getCatalog()
      .then((data) => {
        if (cancelled) return
        setCatalog({
          courses: data.courses || [],
          categories: data.categories?.length ? data.categories : ['All'],
          packages: data.packages || [],
          loading: false,
          error: '',
        })
      })
      .catch(() => {
        if (cancelled) return
        setCatalog((current) => ({
          ...current,
          loading: false,
          error: 'Could not load courses. Refresh the page and try again.',
        }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}
