'use client'

import { HmdSchema, getHMDInfo } from '@ssr/common/hmds'
import Combobox from './ui/combo-box'

type HmdSelectorProps = {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  className?: string;
  clearable?: boolean;
  placeholder?: string;
}

export default function HmdSelector({
  value,
  onValueChange,
  className,
  clearable,
  placeholder,
}: HmdSelectorProps) {
  const availableHmds = HmdSchema.options.filter(hmd => hmd !== 'Unknown')

  return (
    <Combobox<string | undefined>
      className={className}
      clearable={clearable}
      items={availableHmds.map(hmd => {
        const info = getHMDInfo(hmd)
        return {
          value: hmd,
          name: hmd,
          displayName: hmd,
          icon: (
            <img
              src={`/assets/hmds/${info.logo}`}
              alt={hmd}
              width={16}
              height={16}
              className="object-contain"
              style={{ filter: info.filters }}
            />
          ),
        }
      })}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
    />
  )
}
