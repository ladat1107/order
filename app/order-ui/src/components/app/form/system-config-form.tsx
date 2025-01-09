import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronsLeftRight, PencilLine } from 'lucide-react'

import { Label, Input, Button } from '@/components/ui'
import { useCreateSystemConfig, useSystemConfigs } from '@/hooks'
import { ISystemConfig } from '@/types'
import { ConfigDropdown } from '@/app/system/config'
import { showToast } from '@/utils'
import { ButtonLoading } from '../loading'

// Component con để quản lý hàng mới
const NewConfigRow = ({
  config,
  onChange,
  onToggleDescription,
  isEditingDescription,
  t,
}: {
  config: ISystemConfig
  onChange: (slug: string, field: keyof ISystemConfig, value: string) => void
  onRemove: (slug: string) => void
  onToggleDescription: (slug: string) => void
  isEditingDescription: boolean
  t: (key: string) => string
}) => (
  <div className="col-span-8 grid w-full grid-cols-1 items-center gap-4 lg:grid-cols-2">
    <div className="flex w-full flex-col gap-2">
      <Label>{t('config.key')}</Label>
      <Input
        value={config.key}
        onChange={(e) => onChange(config.slug, 'key', e.target.value)}
        placeholder="Enter key"
      />
    </div>
    <div className="flex w-full flex-col gap-2">
      <Label>Value</Label>
      <Input
        value={config.value}
        onChange={(e) => onChange(config.slug, 'value', e.target.value)}
        placeholder="Enter value"
      />
    </div>
  </div>
)

// Component con để quản lý hàng đã lưu
const ConfigRow = ({ config }: { config: ISystemConfig }) => (
  <div className="flex flex-col gap-2 rounded-md border bg-white p-2 lg:flex-row">
    {/* Left */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="col-span-1 h-fit w-fit rounded-full bg-gray-100 p-2">
          <ChevronsLeftRight size={18} />
        </div>
        <span className="col-span-3 text-sm">{config.key}</span>
      </div>
      <div className="col-span-1 flex items-end justify-end gap-2 lg:hidden">
        <ConfigDropdown systemConfig={config} />
      </div>
    </div>
    {/* Center */}
    <div className="flex items-center justify-between gap-3">
      {/* Value */}
      <span className="col-span-6 text-sm">{config.value}</span>
    </div>
    {/* Action */}
    <div className="col-span-1 ml-auto hidden items-end justify-end gap-2 lg:flex">
      <ConfigDropdown systemConfig={config} />
    </div>
  </div>
)

export const SystemConfigForm: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['config'])
  const { t: tToast } = useTranslation(['toast'])
  const { data: systemConfigs } = useSystemConfigs()
  const { mutate: createConfig, isPending } = useCreateSystemConfig()

  const [configs, setConfigs] = React.useState<ISystemConfig[]>([])
  const [newConfigs, setNewConfigs] = React.useState<ISystemConfig[]>([
    {
      key: '',
      value: '',
      slug: '',
      description: '',
      createdAt: new Date().toISOString(),
    },
  ])
  const [editingDescriptionSlugs, setEditingDescriptionSlugs] = React.useState<
    string[]
  >([])

  React.useEffect(() => {
    if (systemConfigs?.result) {
      setConfigs(systemConfigs.result)
    }
  }, [systemConfigs])

  const updateConfigField = (
    slug: string,
    field: keyof ISystemConfig,
    value: string,
  ) => {
    setNewConfigs((prevConfigs) =>
      prevConfigs.map((config) =>
        config.slug === slug ? { ...config, [field]: value } : config,
      ),
    )
  }

  const createNewConfigs = async () => {
    // Lọc các cấu hình hợp lệ (có key và value)
    const validConfigs = newConfigs.filter(
      (config) => config.key && config.value,
    )

    if (validConfigs.length > 0) {
      await Promise.all(
        validConfigs.map((config) => {
          // Loại bỏ trường slug trước khi gửi đến API
          const { ...configData } = config

          return createConfig(configData, {
            onSuccess: () => {
              setNewConfigs([
                {
                  key: '',
                  value: '',
                  slug: '',
                  description: '',
                  createdAt: new Date().toISOString(),
                },
              ])
              queryClient.invalidateQueries({
                queryKey: ['systemConfigs'],
              })
              showToast(tToast('toast.createSystemConfigSuccess'))
            },
          })
        }),
      )
    }
  }

  const removeConfig = (slug: string) => {
    setNewConfigs((prevConfigs) =>
      prevConfigs.filter((config) => config.slug !== slug),
    )
    setEditingDescriptionSlugs((prevSlugs) =>
      prevSlugs.filter((s) => s !== slug),
    )
  }

  const toggleDescriptionInput = (slug: string) => {
    setEditingDescriptionSlugs((prevSlugs) =>
      prevSlugs.includes(slug)
        ? prevSlugs.filter((s) => s !== slug)
        : [...prevSlugs, slug],
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Khu vực thêm mới */}
      <div className="border-b border-gray-300 pb-4">
        <h3 className="mb-4 text-lg font-semibold">Add New Configuration</h3>
        <div className="grid w-full gap-2">
          {newConfigs.map((config) => (
            <NewConfigRow
              t={t}
              key={config.slug}
              config={config}
              onChange={updateConfigField}
              onRemove={removeConfig}
              onToggleDescription={toggleDescriptionInput}
              isEditingDescription={editingDescriptionSlugs.includes(
                config.slug,
              )}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            disabled={isPending}
            onClick={createNewConfigs}
            className="mt-4"
          >
            {isPending ? <ButtonLoading /> : t('config.save')}
          </Button>
        </div>
      </div>

      {/* Danh sách config */}
      <div className="mt-6">
        <h3 className="mb-4 text-lg font-semibold">Configuration List</h3>
        {configs.length > 0 ? (
          <div className="grid w-full gap-2">
            {configs.map((config) => (
              <ConfigRow key={config.slug} config={config} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No configurations found.</p>
        )}
      </div>
    </div>
  )
}
