import { Label, Switch } from '@/components/ui'
import { useTranslation } from 'react-i18next'

interface IIsLimitSwitchProps {
  defaultValue: boolean
  onChange: (checked: boolean) => void
}

export default function IsLimitSwitch({ defaultValue, onChange }: IIsLimitSwitchProps) {
  const { t } = useTranslation(['product'])
  return (
    <div className="flex items-center gap-4 py-2">
      <Label>{t('product.isLimited')}</Label>
      <Switch defaultChecked={defaultValue} onCheckedChange={onChange} />
    </div>
  )
}
