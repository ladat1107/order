import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable } from '@/components/ui'
import { useAllMenus, usePagination } from '@/hooks'
import { useUserStore } from '@/stores'
import { useMenusColumns } from '@/app/system/menu-management/DataTable/columns'
import { MenusActionOptions } from '@/app/system/menu-management/DataTable/actions'
import { IMenu } from '@/types'
import { ROUTE } from '@/constants'


export function SystemMenuManagementTabsContent() {
  const navigate = useNavigate()
  const { userInfo } = useUserStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const { pagination, handlePageChange, handlePageSizeChange } = usePagination()
  const { data, isLoading } = useAllMenus({
    order: 'DESC',
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    branch: userInfo?.branch?.slug,
    isTemplate: tab === 'isTemplate' ? true : false,
  })

  useEffect(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.set('tab', tab || 'isTemplate')
      return newParams
    })
  }, [setSearchParams, tab])


  const handleRowClick = (row: IMenu) => {
    navigate(`${ROUTE.STAFF_MENU_MANAGEMENT}/${row.slug}`)
  }
  return (
    <div className="grid grid-cols-1 gap-6">
      <DataTable
        columns={useMenusColumns()}
        data={data?.result.items || []}
        isLoading={isLoading}
        pages={data?.result?.totalPages || 0}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        actionOptions={MenusActionOptions}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
