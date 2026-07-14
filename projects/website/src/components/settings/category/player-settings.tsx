'use client'

import { HistoryMode } from '@/common/player/history-mode'
import useDatabase from '@/hooks/use-database'
import { useSettingsForm } from '@/hooks/use-settings-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { History, LayoutDashboardIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Path, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form } from '../../ui/form'
import { SettingSection } from '../setting-section'
import { SettingsCategorySkeleton } from '../settings-category-skeleton'
import { getMonotonicTimeMs, showSettingsSavedToast } from '../settings-feedback'

const VIEW_LABELS = [
  'Ranking',
  'Accuracy',
  'Scores',
  'Scores Graph',
  'Skill Triangle',
  'PP Calculator',
  'Acc Badges',
  'PP Simulator',
  'Map Recommendations',
  'Session Analysis',
  'Rivalries',
  'Difficulty Curve',
  'Skill Breakdown',
]

const formSchema = z.object({
  historyMode: z.string().min(1).max(32),
  ...Object.fromEntries(VIEW_LABELS.map((_, i) => [ `view_${i}`, z.boolean() ])) as Record<`view_${number}`, z.ZodBoolean>,
})

type FormValues = z.infer<typeof formSchema>

const settings = [
  {
    id: 'historyMode',
    title: 'History Mode',
    icon: History,
    fields: [
      {
        name: 'historyMode' as Path<FormValues>,
        label: 'History Mode',
        type: 'select' as const,
        description: 'Choose which history mode to use',
        options: [
          {
            value: HistoryMode.ADVANCED,
            label: 'Advanced',
          },
          {
            value: HistoryMode.SIMPLE,
            label: 'Simple',
          },
        ],
      },
    ],
  },
  {
    id: 'enabledViews',
    title: 'Enabled Player Views',
    icon: LayoutDashboardIcon,
    fields: VIEW_LABELS.map((label, i) => ({
      name: `view_${i}` as Path<FormValues>,
      label,
      type: 'checkbox' as const,
      description: `Show the ${label} view on player profiles`,
    })),
  },
] as const

const PlayerSettings = () => {
  const database = useDatabase()

  const defaultViews = Object.fromEntries(VIEW_LABELS.map((_, i) => [ `view_${i}`, true ]))

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema, { reportInput: true }),
    defaultValues: {
      historyMode: HistoryMode.SIMPLE,
      ...defaultViews,
    },
  })

  // Sync form with database settings
  const { isLoading } = useSettingsForm(form, {
    historyMode: () => database.getHistoryMode(),
  })

  useEffect(() => {
    const loadEnabledViews = async () => {
      const enabled = await database.getEnabledPlayerViews()
      const values: Record<string, boolean> = {}
      for (let i = 0; i < VIEW_LABELS.length; i++) {
        values[`view_${i}`] = enabled.includes(i)
      }
      form.reset({
        ...form.getValues(),
        ...values,
      })
    }
    loadEnabledViews()
  }, [ database, form ])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const before = getMonotonicTimeMs()

    const enabledViews: number[] = []
    const formValues = values as unknown as Record<string, boolean>
    for (let i = 0; i < VIEW_LABELS.length; i++) {
      if (formValues[`view_${i}`]) {
        enabledViews.push(i)
      }
    }

    await database.setHistoryMode(values.historyMode as HistoryMode)
    await database.setEnabledPlayerViews(enabledViews)
    showSettingsSavedToast(before)
  }

  if (isLoading) {
    return <SettingsCategorySkeleton />
  }

  return (
    <div className="flex flex-col gap-8">
      <Form {...form}>
        <form className="flex flex-col gap-8">
          {settings.map(section => (
            <SettingSection
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

PlayerSettings.displayName = 'PlayerSettings'

export default PlayerSettings
