'use client'

import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { useEffect } from 'react'

export function useThemeColors() {
  const database = useDatabase()
  const primaryColor = useStableLiveQuery(() => database.getPrimaryColor())
  const accentColor = useStableLiveQuery(() => database.getAccentColor())
  const useGradient = useStableLiveQuery(() => database.getUseGradient())

  useEffect(() => {
    const root = document.documentElement
    if (primaryColor) {
      root.style.setProperty('--primary', primaryColor)
    }
    if (useGradient && accentColor && accentColor !== primaryColor) {
      root.style.setProperty('--accent-secondary', accentColor)
    } else if (primaryColor) {
      root.style.setProperty('--accent-secondary', primaryColor)
    }
  }, [ primaryColor, accentColor, useGradient ])
}
