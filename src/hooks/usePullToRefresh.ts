'use client'

import { useRef, useState, useCallback, RefObject } from 'react'

interface UsePullToRefreshReturn {
  containerRef: RefObject<HTMLDivElement>
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 60
): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollTop > 0) return // only trigger at top
    startYRef.current = e.touches[0].clientY
    setIsPulling(true)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return
    const dy = e.touches[0].clientY - startYRef.current
    if (dy < 0) {
      setPullDistance(0)
      return
    }
    // Resistance: slow down after threshold
    const distance = Math.min(dy * 0.5, threshold * 1.5)
    setPullDistance(distance)
  }, [isPulling, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      setPullDistance(0)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, onRefresh])

  // Attach listeners when ref is available
  const setRef = useCallback((node: HTMLDivElement | null) => {
    const current = containerRef.current
    if (current) {
      current.removeEventListener('touchstart', handleTouchStart)
      current.removeEventListener('touchmove', handleTouchMove)
      current.removeEventListener('touchend', handleTouchEnd)
    }
    if (node) {
      node.addEventListener('touchstart', handleTouchStart, { passive: true })
      node.addEventListener('touchmove', handleTouchMove, { passive: true })
      node.addEventListener('touchend', handleTouchEnd)
    }
    // @ts-ignore
    containerRef.current = node
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    containerRef: { current: containerRef.current } as RefObject<HTMLDivElement>,
    isPulling,
    pullDistance,
    isRefreshing,
  }
}
