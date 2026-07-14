'use client'

import { cn } from '@/common/utils'
import { getHMDInfo } from '@ssr/common/hmds'
import { PlayerWrappedResponse } from '@ssr/common/schemas/response/player/player-wrapped'
import { formatNumberWithCommas, formatPp } from '@ssr/common/utils/number-utils'
import { getScoreBadgeFromName } from '@ssr/common/utils/song-utils'
import {
  ActivityIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  CpuIcon,
  DogIcon,
  DumbbellIcon,
  FastForwardIcon,
  FlameIcon,
  FrownIcon,
  GamepadIcon,
  HeadsetIcon,
  MusicIcon,
  ScaleIcon,
  SparklesIcon,
  StarIcon,
  SwordsIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserCircleIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const gradeOrder = [
  {
    key: 'godPlays',
    label: 'GOD',
  },
  {
    key: 'sspPlays',
    label: 'SS+',
  },
  {
    key: 'ssPlays',
    label: 'SS',
  },
  {
    key: 'spPlays',
    label: 'S+',
  },
  {
    key: 'sPlays',
    label: 'S',
  },
  {
    key: 'aPlays',
    label: 'A',
  },
] as const

function getPpMessage(pp: number): string {
  if (pp >= 1000)
    return 'You absolutely dominated the leaderboards.'
  if (pp >= 500)
    return 'A massive leap forward this year.'
  if (pp >= 200)
    return 'Solid gains, you kept pushing.'
  if (pp >= 50)
    return 'Every bit of pp counts!'
  if (pp >= 0)
    return 'You held your ground this year.'
  return 'A tough year, but you kept playing.'
}

function getRankMessage(start: number | null, end: number | null): string {
  if (start === null || end === null)
    return 'Your journey is just beginning.'
  const diff = start - end
  if (diff >= 1000)
    return 'Incredible climb, you flew up the ranks.'
  if (diff >= 500)
    return 'A massive jump, the grind paid off.'
  if (diff >= 100)
    return 'Steady and sure, you kept climbing.'
  if (diff >= 0)
    return 'You held your spot. No small feat.'
  return 'The competition is fierce, keep pushing.'
}

function getPlaysMessage(plays: number): string {
  if (plays >= 5000)
    return 'You\'re basically living in Beat Saber.'
  if (plays >= 2000)
    return 'You put in serious hours this year.'
  if (plays >= 1000)
    return 'Over a thousand plays, dedicated!'
  if (plays >= 500)
    return 'You showed up and delivered.'
  if (plays >= 100)
    return 'Every play is a step forward.'
  return 'Quality over quantity, a focused year.'
}

function getActiveDaysMessage(days: number): string {
  if (days >= 300)
    return 'Beat Saber was basically your second home.'
  if (days >= 200)
    return 'You were incredibly consistent this year.'
  if (days >= 100)
    return 'Over 100 days of rhythm, impressive!'
  if (days >= 50)
    return 'You made time for what you love.'
  return 'Every day you played was a win.'
}

function SlideWrapper({ children, className }: {
  children: React.ReactNode,
  className?: string
}) {
  return (
    <div className={cn(
      'flex h-full w-full flex-col items-center justify-center px-8 text-center',
      'animate-in fade-in slide-in-from-bottom-4 duration-500',
      className,
    )}>
      {children}
    </div>
  )
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{children}</p>
  )
}

function SlideBigNumber({ children, className }: {
  children: React.ReactNode,
  className?: string
}) {
  return (
    <p className={cn('text-7xl font-black leading-none tracking-tight', className)}>{children}</p>
  )
}

function SlideSubtext({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{children}</p>
  )
}

type SlideProps = {
  data: PlayerWrappedResponse;
  year: number;
}

function IntroSlide({ year }: SlideProps) {
  return (
    <SlideWrapper>
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-pink-500 shadow-2xl shadow-violet-500/30">
        <SparklesIcon className="size-10 text-white" />
      </div>
      <h1 className="text-5xl font-black text-white">{year}</h1>
      <p className="mt-2 text-2xl font-bold text-white/80">Wrapped</p>
      <p className="mt-4 text-sm text-white/40">Your year in Beat Saber</p>
    </SlideWrapper>
  )
}

function PlaysSlide({ data }: SlideProps) {
  const hoursPlayed = Math.floor(data.totalPlaySeconds / 3600)
  const minutesPlayed = Math.floor((data.totalPlaySeconds % 3600) / 60)

  return (
    <SlideWrapper>
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-violet-500/20">
        <ZapIcon className="size-7 text-violet-300" />
      </div>
      <SlideLabel>This year you played</SlideLabel>
      <SlideBigNumber className="text-violet-300">{formatNumberWithCommas(data.totalPlays)}</SlideBigNumber>
      <p className="mt-2 text-lg font-semibold text-white/50">songs</p>
      <div className="mt-5 flex gap-6 text-sm">
        <div className="text-center">
          <p className="text-xl font-bold text-amber-300">{formatNumberWithCommas(data.totalRankedPlays)}</p>
          <p className="text-white/40">Ranked</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <p className="text-xl font-bold text-blue-300">{formatNumberWithCommas(data.totalUnrankedPlays)}</p>
          <p className="text-white/40">Unranked</p>
        </div>
      </div>
      {data.totalPlaySeconds > 0 && (
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-white/5 px-6 py-3">
          <div className="flex items-center gap-2 text-white/40">
            <ClockIcon className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Time In-Game</span>
          </div>
          <p className="mt-1 text-lg font-bold text-white">
            {hoursPlayed > 0 ? `${hoursPlayed}h ` : ''}{minutesPlayed}m
          </p>
        </div>
      )}
      <SlideSubtext>{getPlaysMessage(data.totalPlays)}</SlideSubtext>
    </SlideWrapper>
  )
}

function ActiveDaysSlide({ data }: SlideProps) {
  return (
    <SlideWrapper>
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-emerald-500/20">
        <ActivityIcon className="size-7 text-emerald-300" />
      </div>
      <SlideLabel>You were active</SlideLabel>
      <SlideBigNumber className="text-emerald-300">{data.activeDays}</SlideBigNumber>
      <p className="mt-2 text-lg font-semibold text-white/50">days out of 365</p>
      <div className="mt-6 h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-linear-to-r from-emerald-400 to-teal-400 transition-all duration-1000"
          style={{ width: `${Math.min((data.activeDays / 365) * 100, 100)}%` }}
        />
      </div>
      <SlideSubtext>{getActiveDaysMessage(data.activeDays)}</SlideSubtext>
    </SlideWrapper>
  )
}

function AccuracySlide({ data }: SlideProps) {
  return (
    <SlideWrapper>
      <SlideLabel>Your average accuracy was</SlideLabel>
      <SlideBigNumber className="bg-linear-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
        {data.averageAccuracy.toFixed(2)}%
      </SlideBigNumber>
      <div className="mt-6 w-full max-w-xs">
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-500 to-pink-500 transition-all duration-1000"
            style={{ width: `${Math.min(data.averageAccuracy, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/30">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      <SlideSubtext>
        {data.averageAccuracy >= 95
          ? 'You make every note look like a joke.'
          : data.averageAccuracy >= 90
            ? 'Now that\'s what I call precision.'
            : data.averageAccuracy >= 80
              ? 'Keep up the good work!'
              : 'Well at least you tried!'}
      </SlideSubtext>
    </SlideWrapper>
  )
}

function GradeSlide({ data }: SlideProps) {
  const total = gradeOrder.reduce((acc, g) => acc + (data[g.key] ?? 0), 0)
  const commonGrade = gradeOrder.reduce((acc, g) => (data[g.key] ?? 0) > (data[acc.key] ?? 0) ? g : acc, gradeOrder[0])

  return (
    <SlideWrapper>
      <SlideLabel>Your grade breakdown</SlideLabel>
      <div className="mt-2 flex w-full max-w-sm items-end justify-around gap-2">
        {gradeOrder.map(({ key, label }) => {
          const count = data[key] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          const badge = getScoreBadgeFromName(label)
          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <p className="text-xs font-bold text-white">{formatNumberWithCommas(count)}</p>
              <div
                className="w-8 rounded-t-md transition-all duration-700"
                style={{
                  height: `${Math.max(pct * 1.2, count > 0 ? 8 : 2)}px`,
                  background: `color-mix(in srgb, ${badge.color} 60%, transparent)`,
                }}
              />
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold"
                style={{
                  background: `color-mix(in srgb, ${badge.color} 20%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${badge.color} 40%, transparent)`,
                  color: badge.textColor ?? badge.color,
                }}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>
      {commonGrade && (
        <SlideSubtext>
          Your most common grade was <span className="font-bold text-white">{commonGrade.label}</span> with{' '}
          {formatNumberWithCommas(data[commonGrade.key] ?? 0)} plays.
        </SlideSubtext>
      )}
    </SlideWrapper>
  )
}

function RankSlide({ data }: SlideProps) {
  const rankImproved = data.rankStart !== null && data.rankEnd !== null && data.rankEnd < data.rankStart
  const hasData = data.rankStart !== null && data.rankEnd !== null

  return (
    <SlideWrapper>
      <div className={cn(
        'mb-4 flex size-14 items-center justify-center rounded-xl',
        rankImproved ? 'bg-emerald-500/20' : 'bg-red-500/20',
      )}>
        {rankImproved
          ? <TrendingUpIcon className="size-7 text-emerald-300" />
          : <TrendingDownIcon className="size-7 text-red-300" />}
      </div>
      <SlideLabel>Your global rank</SlideLabel>
      {hasData ? (
        <>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-white/40">Start</p>
              <p className="text-3xl font-black text-white/60">#{formatNumberWithCommas(data.rankStart!)}</p>
            </div>
            <div className={cn('text-2xl font-black', rankImproved ? 'text-emerald-400' : 'text-red-400')}>
              {rankImproved ? '↑' : '↓'}
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40">End</p>
              <p className={cn('text-3xl font-black', rankImproved ? 'text-emerald-300' : 'text-red-300')}>
                #{formatNumberWithCommas(data.rankEnd!)}
              </p>
            </div>
          </div>
          <SlideSubtext>{getRankMessage(data.rankStart, data.rankEnd)}</SlideSubtext>
        </>
      ) : (
        <p className="mt-4 text-white/40">Not enough data to compare. :x</p>
      )}
    </SlideWrapper>
  )
}

function PpSlide({ data }: SlideProps) {
  const positive = data.ppGained >= 0
  return (
    <SlideWrapper>
      <SlideLabel>You gained</SlideLabel>
      <SlideBigNumber className={positive ? 'text-emerald-300' : 'text-red-400'}>
        {positive ? '+' : ''}{formatPp(data.ppGained)}pp
      </SlideBigNumber>
      {data.ppStart !== null && data.ppEnd !== null && (
        <p className="mt-3 text-sm text-white/40">
          {formatPp(data.ppStart)}pp → {formatPp(data.ppEnd)}pp
        </p>
      )}
      <SlideSubtext>{getPpMessage(data.ppGained)}</SlideSubtext>
    </SlideWrapper>
  )
}

function TopPlaySlide({ data, year }: SlideProps) {
  if (!data.topPlay)
    return null
  const { topPlay } = data
  const artUrl = `https://cdn.scoresaber.com/covers/${topPlay.songHash.toUpperCase()}.png`

  return (
    <SlideWrapper className="relative overflow-hidden">
      <img
        src={artUrl}
        alt={topPlay.songName}
        className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/40" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 flex items-center gap-2 text-amber-400/80">
          <StarIcon className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Top Play of {year}</p>
        </div>
        <div className="mb-4 overflow-hidden rounded-xl shadow-2xl shadow-black/50">
          <img src={artUrl} alt={topPlay.songName} className="h-36 w-36 object-cover" />
        </div>
        <h2 className="max-w-xs text-xl font-black leading-tight text-white">{topPlay.songName}</h2>
        <p className="mt-1 text-sm text-white/40">{topPlay.difficulty} · {topPlay.characteristic}</p>
        {topPlay.stars > 0 && (
          <span className="mt-2 flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-300">
            <StarIcon className="size-3.5" />
            {topPlay.stars.toFixed(2)}★
          </span>
        )}
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-black text-amber-300">{formatPp(topPlay.pp)}pp</p>
            <p className="text-xs text-white/40">Performance</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-black text-white">{topPlay.accuracy.toFixed(2)}%</p>
            <p className="text-xs text-white/40">Accuracy</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-black text-white">#{formatNumberWithCommas(topPlay.rank)}</p>
            <p className="text-xs text-white/40">Rank</p>
          </div>
        </div>
        {topPlay.fullCombo && (
          <span className="mt-4 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-bold text-emerald-400">
            Full Combo ✓
          </span>
        )}
      </div>
    </SlideWrapper>
  )
}

function MapperSlide({ data }: SlideProps) {
  if (!data.topMapper)
    return null
  return (
    <SlideWrapper>
      <div className="mb-4 flex size-20 items-center justify-center overflow-hidden rounded-full bg-blue-500/20 shadow-xl shadow-blue-500/20">
        {data.topMapperAvatar ? (
          <img src={data.topMapperAvatar} alt={data.topMapper} className="h-full w-full object-cover" />
        ) : (
          <UserCircleIcon className="size-10 text-blue-300" />
        )}
      </div>
      <SlideLabel>Your favorite mapper</SlideLabel>
      <h2 className="text-4xl font-black text-white">{data.topMapper}</h2>
      <p className="mt-2 text-lg font-semibold text-white/50">
        You played their maps <span className="text-blue-300">{formatNumberWithCommas(data.topMapperPlays!)}</span> times.
      </p>
      <SlideSubtext>I bet they'd be working at McDonald's if it weren't for you.</SlideSubtext>
    </SlideWrapper>
  )
}

const STYLE_MAP: Record<string, {
  label: string;
  textClass: string;
  bgClass: string;
  Icon: React.ElementType;
  subtext: string
}> = {
  tech: {
    label: 'Tech',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/20',
    Icon: CpuIcon,
    subtext: 'Well, I\'m hoping your wrists are insured, and your brain still intact.',
  },
  speed: {
    label: 'Speed',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/20',
    Icon: FastForwardIcon,
    subtext: 'Speedslop at it\'s finest.',
  },
  balanced: {
    label: 'Balanced',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/20',
    Icon: ScaleIcon,
    subtext: 'It\'s a peaceful life you\'re leading.',
  },
  'dance-style': {
    label: 'Dance',
    textClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-500/20',
    Icon: MusicIcon,
    subtext: 'Grooving to the beat.',
  },
  challenge: {
    label: 'Challenge',
    textClass: 'text-red-500',
    bgClass: 'bg-red-500/20',
    Icon: FlameIcon,
    subtext: 'A glutton for punishment.',
  },
  accuracy: {
    label: 'Accuracy',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    Icon: TargetIcon,
    subtext: 'By no means that\'s bad, but it\'s still pretty boring.',
  },
  fitness: {
    label: 'Fitness',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/20',
    Icon: DumbbellIcon,
    subtext: 'Who needs a gym when you have Beat Saber?',
  },
  poodle: {
    label: 'Poodle',
    textClass: 'text-pink-400',
    bgClass: 'bg-pink-500/20',
    Icon: DogIcon,
    subtext: 'Aw hell nah, get the fuck outta here.',
  },
}

function StyleSlide({ data }: SlideProps) {
  if (!data.topStyle)
    return null

  const styleConfig = STYLE_MAP[data.topStyle] || {
    label: data.topStyle,
    textClass: 'text-white',
    bgClass: 'bg-white/20',
    Icon: GamepadIcon,
    subtext: 'Your unique style.',
  }

  const { Icon } = styleConfig

  return (
    <SlideWrapper>
      <div className={cn('mb-4 flex size-14 items-center justify-center rounded-xl', styleConfig.bgClass)}>
        <Icon className={cn('size-7', styleConfig.textClass)} />
      </div>
      <SlideLabel>Your Mapping Style</SlideLabel>
      <h2 className={cn('text-6xl font-black', styleConfig.textClass)}>{styleConfig.label}</h2>
      <p className="mt-4 text-lg font-semibold text-white/50">
        You played this style <span className={styleConfig.textClass}>{formatNumberWithCommas(data.topStylePlays!)}</span> times.
      </p>
      <SlideSubtext>{styleConfig.subtext}</SlideSubtext>
    </SlideWrapper>
  )
}

function HardwareSlide({ data }: SlideProps) {
  if (!data.topHmd)
    return null
  const hmdInfo = getHMDInfo(data.topHmd)

  return (
    <SlideWrapper>
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-zinc-500/20">
        <HeadsetIcon className="size-7 text-zinc-300" />
      </div>
      <SlideLabel>Your weapon of choice</SlideLabel>
      <div className="my-6">
        <img
          src={`/assets/hmds/${hmdInfo.logo}`}
          alt={data.topHmd}
          className="h-20 max-w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          style={{ filter: hmdInfo.filters }}
        />
      </div>
      <h2 className="text-4xl font-black text-white">{data.topHmd}</h2>
      <p className="mt-2 text-lg font-semibold text-white/50">
        Used for <span className="text-zinc-300">{formatNumberWithCommas(data.topHmdPlays!)}</span> plays.
      </p>
      <SlideSubtext>Ol' reliable.</SlideSubtext>
    </SlideWrapper>
  )
}

function ComboSlide({ data }: SlideProps) {
  if (!data.biggestCombo)
    return null
  const { biggestCombo } = data
  const artUrl = `https://cdn.scoresaber.com/covers/${biggestCombo.songHash.toUpperCase()}.png`

  return (
    <SlideWrapper className="relative overflow-hidden">
      <img
        src={artUrl}
        alt={biggestCombo.songName}
        className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/40" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 flex items-center gap-2 text-emerald-400/80">
          <SwordsIcon className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Biggest Combo</p>
        </div>
        <div className="mb-4 overflow-hidden rounded-xl shadow-2xl shadow-emerald-500/20">
          <img src={artUrl} alt={biggestCombo.songName} className="h-28 w-28 object-cover" />
        </div>
        <h2 className="max-w-xs text-xl font-black leading-tight text-white">{biggestCombo.songName}</h2>
        <p className="mt-1 text-sm text-white/40">{biggestCombo.difficulty} · {biggestCombo.characteristic}</p>

        <div className="mt-8">
          <SlideBigNumber className="text-emerald-400">
            {formatNumberWithCommas(biggestCombo.maxCombo ?? 0)}x
          </SlideBigNumber>
        </div>
        <SlideSubtext>Honestly, how did you not break your wrists?</SlideSubtext>
      </div>
    </SlideWrapper>
  )
}

function ChokeSlide({ data }: SlideProps) {
  if (!data.worstChoke)
    return null
  const { worstChoke } = data
  const artUrl = `https://cdn.scoresaber.com/covers/${worstChoke.songHash.toUpperCase()}.png`

  return (
    <SlideWrapper className="relative overflow-hidden">
      <img
        src={artUrl}
        alt={worstChoke.songName}
        className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm grayscale"
      />
      <div className="absolute inset-0 bg-linear-to-t from-red-950/90 via-black/80 to-black/60" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 flex items-center gap-2 text-red-400/80">
          <FrownIcon className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Biggest Heartbreak</p>
        </div>
        <div className="mb-4 overflow-hidden rounded-xl shadow-2xl shadow-red-500/20 border border-red-500/30">
          <img src={artUrl} alt={worstChoke.songName} className="h-28 w-28 object-cover" />
        </div>
        <h2 className="max-w-xs text-xl font-black leading-tight text-white">{worstChoke.songName}</h2>
        <p className="mt-1 text-sm text-white/40">{worstChoke.difficulty} · {worstChoke.characteristic}</p>

        <div className="mt-6 flex flex-col items-center rounded-2xl bg-red-950/40 px-6 py-4 border border-red-500/20">
          <p className="text-3xl font-black text-red-400">{worstChoke.missedNotes! + worstChoke.badCuts!} Miss</p>
          <p className="mt-1 text-sm text-white/60">On a {formatPp(worstChoke.pp)}pp play</p>
        </div>
        <SlideSubtext>We've all been there...</SlideSubtext>
      </div>
    </SlideWrapper>
  )
}

function OutroSlide({ data, year }: SlideProps) {
  return (
    <SlideWrapper>
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-pink-500 shadow-2xl shadow-pink-500/30">
        <SparklesIcon className="size-10 text-white" />
      </div>
      <SlideLabel>That was your</SlideLabel>
      <h1 className="text-5xl font-black text-white">{year}</h1>
      <p className="mt-1 text-2xl font-bold text-white/80">in Beat Saber</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        <span className="rounded-full bg-violet-500/20 px-4 py-1.5 font-semibold text-violet-300">
          {formatNumberWithCommas(data.totalPlays)} plays
        </span>
        <span className="rounded-full bg-emerald-500/20 px-4 py-1.5 font-semibold text-emerald-300">
          {data.activeDays} active days
        </span>
        {data.ppGained !== 0 && (
          <span className={cn(
            'rounded-full px-4 py-1.5 font-semibold',
            data.ppGained > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300',
          )}>
            {data.ppGained > 0 ? '+' : ''}{formatPp(data.ppGained)}pp
          </span>
        )}
      </div>
      <p className="mt-6 text-sm text-white/40">See you in {year + 1} (✿◠‿◠)</p>
    </SlideWrapper>
  )
}

type PlayerWrappedSlidesProps = {
  data: PlayerWrappedResponse;
  year: number;
  onClose: () => void;
}

export function PlayerWrappedSlides({ data, year, onClose }: PlayerWrappedSlidesProps) {
  const [ slide, setSlide ] = useState(0)

  const slides = [
    {
      id: 'intro',
      component: <IntroSlide data={data} year={year} />,
      bg: 'from-violet-950 via-[#0d0a1e] to-[#0d0a1e]',
    },
    {
      id: 'plays',
      component: <PlaysSlide data={data} year={year} />,
      bg: 'from-violet-950/60 via-[#0d0a1e] to-[#0d0a1e]',
    },
    {
      id: 'days',
      component: <ActiveDaysSlide data={data} year={year} />,
      bg: 'from-emerald-950/60 via-[#0a1e0f] to-[#0d0a1e]',
    },
    ...(data.averageAccuracy > 0 ? [
      {
        id: 'accuracy',
        component: <AccuracySlide data={data} year={year} />,
        bg: 'from-pink-950/60 via-[#1a0d1e] to-[#0d0a1e]',
      },
    ] : []),
    {
      id: 'grades',
      component: <GradeSlide data={data} year={year} />,
      bg: 'from-[#0d0a1e] via-[#0d0a1e] to-[#0d0a1e]',
    },
    {
      id: 'rank',
      component: <RankSlide data={data} year={year} />,
      bg: 'from-[#0a1a0d] via-[#0d0a1e] to-[#0d0a1e]',
    },
    ...(data.topMapper ? [
      {
        id: 'mapper',
        component: <MapperSlide data={data} year={year} />,
        bg: 'from-blue-950/40 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    ...(data.topStyle ? [
      {
        id: 'style',
        component: <StyleSlide data={data} year={year} />,
        bg: 'from-slate-900/60 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    ...(data.topHmd && data.topHmd !== 'Unknown' ? [
      {
        id: 'hardware',
        component: <HardwareSlide data={data} year={year} />,
        bg: 'from-zinc-900/60 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    {
      id: 'pp',
      component: <PpSlide data={data} year={year} />,
      bg: 'from-emerald-950/60 via-[#0d0a1e] to-[#0d0a1e]',
    },
    ...(data.biggestCombo ? [
      {
        id: 'combo',
        component: <ComboSlide data={data} year={year} />,
        bg: 'from-emerald-950/40 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    ...(data.worstChoke ? [
      {
        id: 'choke',
        component: <ChokeSlide data={data} year={year} />,
        bg: 'from-red-950/60 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    ...(data.topPlay ? [
      {
        id: 'topplay',
        component: <TopPlaySlide data={data} year={year} />,
        bg: 'from-amber-950/40 via-[#0d0a1e] to-[#0d0a1e]',
      },
    ] : []),
    {
      id: 'outro',
      component: <OutroSlide data={data} year={year} />,
      bg: 'from-violet-950 via-[#0d0a1e] to-[#0d0a1e]',
    },
  ]

  const current = slides[slide]
  const isFirst = slide === 0
  const isLast = slide === slides.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (!isLast)
          setSlide(s => s + 1)
      }
      if (e.key === 'ArrowLeft') {
        if (!isFirst)
          setSlide(s => s - 1)
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [ isFirst, isLast, onClose ])

  if (typeof window === 'undefined')
    return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-9999 bg-linear-to-b transition-all duration-700',
        current.bg,
      )}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full
        bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
      >
        <XIcon className="size-4" />
      </button>

      <div key={current.id} className="h-full w-full">
        {current.component}
      </div>

      <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSlide(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/30',
            )}
          />
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <button
          onClick={() => setSlide(s => s - 1)}
          disabled={isFirst}
          className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <button
          onClick={isLast ? onClose : () => setSlide(s => s + 1)}
          className="flex items-center gap-2 rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
        >
          {isLast ? 'Close' : 'Next'}
          {!isLast && <ArrowRightIcon className="size-4" />}
        </button>
      </div>
    </div>,
    document.body,
  )
}
