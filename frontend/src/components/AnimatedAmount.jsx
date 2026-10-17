import { useEffect, useRef, useState } from 'react'

/**
 * AnimatedAmount
 * Smoothly animates numbers from start to target value using requestAnimationFrame.
 * - Handles currency prefix (₹) and Indian numbering system (e.g., ₹6,500.55).
 * - Matches exact decimal precision of the target value.
 * - Uses cubic ease-out for a smooth, natural deceleration.
 * - Prevents layout shifts with tabular numbers.
 * - Detects visibility so the animation triggers when the user arrives at/scrolls to the number.
 */
export default function AnimatedAmount({
  value = 0,
  duration = 1400,
  delay = 0,
  prefix = '₹',
  className = '',
}) {
  const target = Number(value || 0)
  const validTarget = Number.isFinite(target) ? target : 0

  const [display, setDisplay] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)
  const prevTargetRef = useRef(0)
  const frameRef = useRef(null)

  // IntersectionObserver to detect when the user comes to this section/number
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Animation runs when visible and target changes
  useEffect(() => {
    if (!isVisible) return

    const startValue = prevTargetRef.current
    const endValue = validTarget
    prevTargetRef.current = endValue

    if (startValue === endValue && display === endValue) {
      return
    }

    let timeoutId = null
    let startTime = null

    const startAnimation = () => {
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Smooth cubic ease-out: 1 - (1 - t)^3
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const current = startValue + (endValue - startValue) * easeProgress

        setDisplay(current)

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setDisplay(endValue)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isVisible, validTarget, duration, delay])

  // Determine decimal formatting
  const hasDecimals = validTarget % 1 !== 0
  const formattedNumber = display.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })

  return (
    <span
      ref={elementRef}
      className={`inline-block tabular-nums tracking-tight ${className}`}
    >
      {prefix}{formattedNumber}
    </span>
  )
}
