'use client'

import {
  format,
  isBefore, startOfDay,
} from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/common/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type FocusedInput = 'from' | 'to' | null

function DateInput({
  label,
  value,
  isActive,
  onClick,
  placeholder,
}: {
  label: string
  value: string | null
  isActive: boolean
  onClick: () => void
  placeholder: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-all',
        'hover:border-ring/60 focus:outline-none',
        isActive
          ? 'border-ring bg-accent/50 ring-1 ring-ring/40'
          : 'border-input bg-background',
      )}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 text-sm', value ? 'text-foreground' : 'text-muted-foreground')}>
        <CalendarIcon className="size-3.5 shrink-0" />
        {value ?? placeholder}
      </span>
    </button>
  )
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: {
  className?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}) {
  const [ focused, setFocused ] = React.useState<FocusedInput>(null)
  const [ open, setOpen ] = React.useState(false)

  const fromStr = date?.from ? format(date.from, 'MMM d, yyyy') : null
  const toStr = date?.to ? format(date.to, 'MMM d, yyyy') : null

  function openFor(field: FocusedInput) {
    setFocused(field)
    setOpen(true)
  }

  function handleSelect(selected: Date | undefined) {
    if (!selected)
      return

    const day = startOfDay(selected)

    if (focused === 'from') {
      const newRange: DateRange = {
        from: day,
        to: date?.to && !isBefore(date.to, day) ? date.to : undefined,
      }
      onDateChange(newRange)
      // Auto-advance to 'to' picker if no end date yet
      if (!newRange.to) {
        setFocused('to')
      } else {
        setOpen(false)
        setFocused(null)
      }
    } else {
      // 'to' mode
      if (date?.from && isBefore(day, date.from)) {
        // Swap: selected a date before the start, treat it as new start
        onDateChange({
          from: day,
          to: date.from,
        })
      } else {
        onDateChange({
          from: date?.from,
          to: day,
        })
      }
      setOpen(false)
      setFocused(null)
    }
  }

  const disabledDays = focused === 'to' && date?.from
    ? { before: date.from }
    : undefined

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <DateInput
        label="From"
        value={fromStr}
        isActive={open && focused === 'from'}
        onClick={() => openFor('from')}
        placeholder="Start date"
      />
      <span className="text-muted-foreground/50 text-sm">→</span>
      <DateInput
        label="To"
        value={toStr}
        isActive={open && focused === 'to'}
        onClick={() => openFor('to')}
        placeholder="End date"
      />

      <Popover open={open} onOpenChange={val => { setOpen(val); if (!val)
        setFocused(null) }}>
        {/* Invisible anchor — positioned absolutely off-screen */}
        <PopoverTrigger asChild>
          <span className="sr-only" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <div className="p-2 pb-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {focused === 'from' ? 'Select start date' : 'Select end date'}
          </div>
          <Calendar
            mode="single"
            selected={focused === 'from' ? date?.from : date?.to}
            onSelect={handleSelect}
            defaultMonth={focused === 'from' ? date?.from : (date?.to ?? date?.from)}
            disabled={disabledDays}
            initialFocus
          />
          {(date?.from || date?.to) && (
            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {fromStr && toStr ? `${fromStr} → ${toStr}` : fromStr ? `From ${fromStr}` : ''}
              </span>
              <button
                onClick={() => { onDateChange(undefined); setOpen(false); setFocused(null) }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
