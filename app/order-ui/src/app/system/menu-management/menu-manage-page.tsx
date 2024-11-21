import { useTranslation } from 'react-i18next'
import { SquareMenu } from 'lucide-react'

import { BreadcrumbComponent } from '@/components/app/breadcrumb'
import { ScrollArea } from '@/components/ui'
import { ProductTab } from '.'

export default function MenuManagementPage() {
  const { t } = useTranslation(['menu'])
  return (
    <div className="flex flex-row gap-2 h-[calc(100vh-4rem)]">
      {/* Menu Section - Scrollable */}
      <ScrollArea className="flex-1">
        <div className={`transition-all duration-300 ease-in-out pl-4`}>
          <div className="sticky top-0 z-10 flex flex-col items-center gap-2 py-3 pr-4 bg-background">
            <div className="flex flex-row items-center justify-between w-full">
              <BreadcrumbComponent />
            </div>
            <div className="flex flex-col flex-1 w-full mt-4">
              <span className="flex items-center gap-1 text-lg">
                <SquareMenu />
                {t('menu.title')}
              </span>
              <ProductTab />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
