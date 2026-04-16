'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
        'text-[#5A7089] hover:bg-[#EEF4FD] hover:text-[#0E2E60]',
        'dark:text-[#7AAAE3] dark:hover:bg-white/10 dark:hover:text-white'
      )}
      aria-label="Alternar tema"
    >
      <Sun
        size={18}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
        )}
      />
      <Moon
        size={18}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
        )}
      />
    </button>
  )
}
