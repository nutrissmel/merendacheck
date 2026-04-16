'use client'

import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

function checkMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(checkMobile)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    function handleResize() {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setIsMobile(checkMobile())
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [])

  return isMobile
}
