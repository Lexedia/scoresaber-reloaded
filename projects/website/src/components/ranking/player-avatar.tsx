import { cn } from '@/common/utils'
import { getCPConfig } from '@/config/cps'
import Image from 'next/image'

export function PlayerAvatar({
  playerId,
  profilePicture,
  name,
  className,
}: {
  playerId?: string;
  profilePicture: string;
  name: string;
  className?: string;
}) {
  const cpConfig = getCPConfig(playerId)

  return (
    <div className={className}>
      <Image
        src={profilePicture}
        alt={name}
        width={28}
        height={28}
        fetchPriority="high"
        className={cn('border-border size-7 min-w-7 rounded-full border object-cover', className, cpConfig?.avatarClass)}
      />
    </div>
  )
}
