import { cn } from '@/common/utils'
import { getCPConfig } from '@/config/cps'
import React from 'react'

type PlayerNameProps = React.HTMLAttributes<HTMLSpanElement> & {
  playerId: string;
  name: string;
}

export function PlayerName({
  playerId, name, className, ...props
}: PlayerNameProps) {
  const cpcConfig = getCPConfig(playerId)

  return (
    <span className={cn(className, cpcConfig?.nameClass)} {...props}>
      {name}
    </span>
  )
}
