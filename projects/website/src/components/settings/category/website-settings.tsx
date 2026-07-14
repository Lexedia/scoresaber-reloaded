'use client'

import {
  DEFAULT_ACCENT_COLOR, DEFAULT_PRIMARY_COLOR, SettingIds, WebsiteLanding,
} from '@/common/database/database'
import { BACKGROUND_COVERS } from '@/components/background-cover'
import { Form, FormDescription, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useBackgroundCover } from '@/hooks/use-background-cover'
import useDatabase from '@/hooks/use-database'
import { useSettingsForm } from '@/hooks/use-settings-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LucideIcon } from 'lucide-react'
import {
  Globe, Image as ImageIcon, Palette, Settings2, Snowflake,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Path, useForm, useFormContext, useWatch,
} from 'react-hook-form'
import { z } from 'zod'
import { Field, SettingSection } from '../setting-section'
import { SettingsCategorySkeleton } from '../settings-category-skeleton'
import { getMonotonicTimeMs, showSettingsSavedToast } from '../settings-feedback'

const PRESETS = [
  {
    name: 'Blue',
    primary: '#5555FF',
    accent: '#9900FF',
  },
  {
    name: 'Purple',
    primary: '#9900FF',
    accent: '#BB44FF',
  },
  {
    name: 'Red',
    primary: '#FF3333',
    accent: '#FF6666',
  },
  {
    name: 'Green',
    primary: '#22CC55',
    accent: '#44DD77',
  },
] as const

const formSchema = z.object({
  backgroundCover: z.string().min(0).max(128),
  backgroundCoverBrightness: z.number().min(0).max(100),
  backgroundCoverBlur: z.number().min(0).max(100),
  snowParticles: z.boolean(),
  showKitty: z.boolean(),
  websiteLanding: z.enum(WebsiteLanding),
  primaryColor: z.string(),
  accentColor: z.string(),
  useGradient: z.boolean(),
  developerMode: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const BackgroundCoverControl = (props: {
  field: {
    value: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
    name?: string;
  };
}) => {
  const {
    selectedOption, customValue, handleSelectChange, handleCustomInputChange,
  } = useBackgroundCover(
    props.field.onChange,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full min-w-0">
        <FormLabel className="text-foreground text-[15px] leading-snug font-medium">
          Background Cover
        </FormLabel>
        <FormDescription className="text-muted-foreground mt-1 text-[13px] leading-snug">
          Change the background cover of the website
        </FormDescription>
        {selectedOption === 'custom' && (
          <Input
            placeholder="Hex color or image URL"
            value={customValue}
            onChange={e => handleCustomInputChange(e.target.value)}
            className="mt-2 h-8 w-full max-w-xl text-xs"
          />
        )}
      </div>
      <div className="w-full min-w-0">
        <RadioGroup
          value={selectedOption}
          onValueChange={handleSelectChange}
          className="flex max-h-[min(320px,50vh)] flex-col gap-2 overflow-y-auto pr-1"
        >
          {Object.values(BACKGROUND_COVERS).map(cover => {
            const id = `background-cover-${cover.id}`
            return (
              <div key={cover.id} className="flex items-center gap-2.5">
                <RadioGroupItem value={cover.id} id={id} />
                <Label htmlFor={id} className="cursor-pointer text-[15px] leading-snug font-normal">
                  {cover.name}
                </Label>
              </div>
            )
          })}
          <div className="flex items-center gap-2.5">
            <RadioGroupItem value="custom" id="background-cover-custom" />
            <Label
              htmlFor="background-cover-custom"
              className="cursor-pointer text-[15px] leading-snug font-normal"
            >
              Custom
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

const ThemeColorControl = (props: {
  field: {
    value: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
    name?: string;
  };
}) => {
  const form = useFormContext<FormValues>()
  const primaryColor = props.field.value as string

  const watchedAccent = useWatch({
    control: form.control,
    name: 'accentColor',
  })
  const watchedGradient = useWatch({
    control: form.control,
    name: 'useGradient',
  })

  const [ accentColor, setAccentColor ] = useState(() => form.getValues('accentColor') || DEFAULT_ACCENT_COLOR)
  const [ useGradient, setUseGradient ] = useState(() => form.getValues('useGradient') || false)

  useEffect(() => {
    if (watchedAccent && watchedAccent !== accentColor)
      setAccentColor(watchedAccent)
  }, [ watchedAccent ])

  useEffect(() => {
    if (watchedGradient !== useGradient)
      setUseGradient(watchedGradient)
  }, [ watchedGradient ])

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setAccentColor(preset.accent)
    setUseGradient(true)
    form.setValue('accentColor', preset.accent)
    form.setValue('useGradient', true)
    props.field.onChange(preset.primary)
  }

  const handlePrimaryChange = (color: string) => {
    props.field.onChange(color)
  }

  const handleAccentChange = (color: string) => {
    setAccentColor(color)
    form.setValue('accentColor', color)
    props.field.onChange(form.getValues('primaryColor'))
  }

  const handleGradientToggle = (enabled: boolean) => {
    setUseGradient(enabled)
    form.setValue('useGradient', enabled)
    props.field.onChange(form.getValues('primaryColor'))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full min-w-0">
        <FormLabel className="text-foreground text-[15px] leading-snug font-medium">
          Theme Colors
        </FormLabel>
        <FormDescription className="text-muted-foreground mt-1 text-[13px] leading-snug">
          Customize the color scheme of the website
        </FormDescription>
      </div>

      <div>
        <span className="text-muted-foreground mb-2 block text-xs font-medium uppercase tracking-wider">
          Quick Pick
        </span>
        <div className="flex gap-3">
          {PRESETS.map(preset => {
            const isActive = primaryColor === preset.primary && accentColor === preset.accent && useGradient
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`group flex size-10 items-center justify-center rounded-full transition-all ${
                  isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ backgroundColor: preset.primary }}
                title={preset.name}
              >
                <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {preset.name[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-foreground shrink-0 text-sm font-medium">Primary</Label>
        <div className="relative">
          <input
            type="color"
            value={primaryColor}
            onChange={e => handlePrimaryChange(e.target.value)}
            className="size-9 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
          />
        </div>
        <Input
          value={primaryColor}
          onChange={e => handlePrimaryChange(e.target.value)}
          className="h-8 w-28 font-mono text-xs uppercase"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="use-gradient"
          checked={useGradient}
          onCheckedChange={handleGradientToggle}
        />
        <Label htmlFor="use-gradient" className="text-foreground cursor-pointer text-sm font-medium">
          Gradient accent
        </Label>
      </div>

      {useGradient && (
        <div className="flex items-center gap-3">
          <Label className="text-foreground shrink-0 text-sm font-medium">Accent</Label>
          <div className="relative">
            <input
              type="color"
              value={accentColor}
              onChange={e => handleAccentChange(e.target.value)}
              className="size-9 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
            />
          </div>
          <Input
            value={accentColor}
            onChange={e => handleAccentChange(e.target.value)}
            className="h-8 w-28 font-mono text-xs uppercase"
          />
        </div>
      )}

      <div
        className="h-6 w-full rounded-md"
        style={{
          background: useGradient && accentColor !== primaryColor
            ? `linear-gradient(to right, ${primaryColor}, ${accentColor})`
            : primaryColor,
        }}
      />
    </div>
  )
}

const settings: {
  id: string;
  title: string;
  icon: LucideIcon;
  fields: Field<FormValues, keyof FormValues>[];
}[] = [
  {
    id: 'background',
    title: 'Background',
    icon: ImageIcon,
    fields: [
      {
        name: 'backgroundCover' as Path<FormValues>,
        label: '',
        type: 'select' as const,
        customControl: BackgroundCoverControl,
      },
      {
        name: 'backgroundCoverBrightness' as Path<FormValues>,
        label: 'Background Cover Brightness',
        type: 'slider' as const,
        description: 'Adjust the brightness of the background cover',
        min: 20,
        max: 100,
        step: 1,
      },
      {
        name: 'backgroundCoverBlur' as Path<FormValues>,
        label: 'Background Cover Blur',
        type: 'slider' as const,
        description: 'Adjust the blur of the background cover',
        min: 0,
        max: 10,
        step: 1,
        labelFormatter: (value: number | undefined) => `${value}px`,
      },
    ],
  },
  {
    id: 'effects',
    title: 'Visual Effects',
    icon: Snowflake,
    fields: [
      {
        name: 'snowParticles' as Path<FormValues>,
        label: 'Show Snow Particles',
        type: 'checkbox' as const,
        description: 'Adds a festive snow effect to the background',
      },
      {
        name: 'showKitty' as Path<FormValues>,
        label: 'Show Kitty',
        type: 'checkbox' as const,
        description: 'Adds a cute kitty that follows your cursor around the screen',
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    icon: Globe,
    fields: [
      {
        name: 'websiteLanding' as Path<FormValues>,
        label: 'Default Landing Page',
        type: 'select' as const,
        description: 'Choose which page to show when first visiting the website',
        options: [
          {
            value: WebsiteLanding.PLAYER_HOME,
            label: 'Player Home',
          },
          {
            value: WebsiteLanding.LANDING,
            label: 'Website Landing',
          },
          {
            value: WebsiteLanding.PLAYER_PAGE,
            label: 'Player Page',
          },
        ],
      },
    ],
  },
  {
    id: 'theme',
    title: 'Theme',
    icon: Palette,
    fields: [
      {
        name: 'primaryColor' as Path<FormValues>,
        label: '',
        type: 'select' as const,
        customControl: ThemeColorControl,
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: Settings2,
    fields: [
      {
        name: 'developerMode' as Path<FormValues>,
        label: 'Developer Mode',
        type: 'checkbox' as const,
        description: 'Enable advanced features',
      },
    ],
  },
]

const WebsiteSettings = () => {
  const database = useDatabase()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema, { reportInput: true }),
    defaultValues: {
      backgroundCover: '',
      backgroundCoverBrightness: 50,
      backgroundCoverBlur: 6,
      snowParticles: false,
      showKitty: false,
      websiteLanding: WebsiteLanding.PLAYER_HOME,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      accentColor: DEFAULT_ACCENT_COLOR,
      useGradient: false,
      developerMode: false,
    },
  })

  // Sync form with database settings
  const { isLoading } = useSettingsForm(
    form,
    {
      backgroundCover: () => database.getBackgroundCover(),
      backgroundCoverBrightness: () => database.getBackgroundCoverBrightness(),
      backgroundCoverBlur: () => database.getBackgroundCoverBlur(),
      snowParticles: () => database.getSnowParticles(),
      showKitty: () => database.getShowKitty(),
      websiteLanding: () => database.getWebsiteLanding(),
      primaryColor: () => database.getPrimaryColor(),
      accentColor: () => database.getAccentColor(),
      useGradient: () => database.getUseGradient(),
      developerMode: () => database.getDeveloperMode(),
    },
    [ 'backgroundCover' ], // Exclude backgroundCover - let BackgroundCoverControl handle it
  )

  async function onSubmit(values: FormValues) {
    const before = getMonotonicTimeMs()
    await Promise.all([
      database.setBackgroundCoverBrightness(values.backgroundCoverBrightness),
      database.setBackgroundCoverBlur(values.backgroundCoverBlur),
      database.setSetting(SettingIds.SnowParticles, values.snowParticles),
      database.setSetting(SettingIds.ShowKitty, values.showKitty),
      database.setWebsiteLanding(values.websiteLanding),
      database.setPrimaryColor(values.primaryColor),
      database.setAccentColor(values.accentColor),
      database.setUseGradient(values.useGradient),
      database.setDeveloperMode(values.developerMode),
    ])

    showSettingsSavedToast(before)
  }

  if (isLoading) {
    return <SettingsCategorySkeleton />
  }

  return (
    <div className="flex flex-col gap-8">
      <Form {...form}>
        <form className="flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
          {settings.map(section => (
            <SettingSection<FormValues>
              key={section.id}
              title={section.title}
              icon={section.icon}
              fields={section.fields}
              form={form}
              onFormSubmit={onSubmit}
            />
          ))}
        </form>
      </Form>
    </div>
  )
}

WebsiteSettings.displayName = 'WebsiteSettings'

export default WebsiteSettings
