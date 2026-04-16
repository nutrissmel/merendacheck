'use client'

import { useRef, useState, useCallback } from 'react'
import type { TouchEventHandler } from 'react'

interface UseSwipeReturn {
  onTouchStart: TouchEventHandler
  onTouchMove: TouchEventHandler
  onTouchEnd: TouchEventHandler
  deltaX: number
}

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
): UseSwipeReturn {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const [deltaX, setDeltaX] = useState(0)

  const onTouchStart: TouchEventHandler = useCallback((e) => {
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    setDeltaX(0)
  }, [])

  const onTouchMove: TouchEventHandler = useCallback((e) => {
    const dx = e.touches[0].clientX - startXRef.current
    const dy = e.touches[0].clientY - startYRef.current

    // Cancel if primarily vertical (scrolling)
    if (Math.abs(dy) > Math.abs(dx)) {
      setDeltaX(0)
      return
    }

    setDeltaX(dx)
  }, [])

  const onTouchEnd: TouchEventHandler = useCallback(() => {
    const dx = deltaX

    if (Math.abs(dx) >= threshold) {
      if (dx < 0) {
        onSwipeLeft()
      } else {
        onSwipeRight()
      }
    }

    setDeltaX(0)
  }, [deltaX, threshold, onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchMove, onTouchEnd, deltaX }
}
