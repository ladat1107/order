import { NavLink } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, SquareMousePointer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import moment from 'moment'

import {
  Button,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui'
import { IProduct } from '@/types'
import {
  UpdateProductDialog,
  DeleteProductDialog,
  UploadProductImageDialog
} from '@/components/app/dialog'
import { publicFileURL, ROUTE } from '@/constants'
import ProductImage from '@/assets/images/ProductImage.png'
export const useProductColumns = (): ColumnDef<IProduct>[] => {
  const { t } = useTranslation(['product'])
  const { t: tCommon } = useTranslation(['common'])
  return [
    {
      accessorKey: 'image',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('product.image')} />,
      cell: ({ row }) => {
        const image = row.getValue('image') ? `${publicFileURL}/${row.getValue('image')}` : ProductImage
        return (
          <img src={image} alt={row.getValue('image')} className="object-cover rounded-md w-36 h-28" />
        )
      }
    },
    {
      accessorKey: 'slug',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('product.slug')} />
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (<DataTableColumnHeader column={column} title={t('product.name')} />),
      cell: ({ row }) => {
        const { name, description } = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="font-bold">{name}</div>
            <p className="overflow-hidden text-sm text-gray-500 break-words line-clamp-3 text-ellipsis">{description}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('product.createdAt')} />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('createdAt')
        return createdAt ? (
          <div>
            {moment(new Date(createdAt as string)).format('DD/MM/YYYY')}
          </div>
        ) : ''
      }
    },
    {
      accessorKey: 'catalog.name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('product.catalog')} />,
      cell: ({ row }) => {
        const product = row.original
        return product ? <span>{product.catalog.name.charAt(0).toUpperCase() + product.catalog.name.slice(1)}</span> : ''
      }
    },
    {
      accessorKey: 'highlight',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('product.highlight')} />
      ),
      cell: ({ row }) => {
        const { isLimit, isTopSell, isNew } = row.original
        return (
          <div className="flex flex-col gap-1.5 min-w-[8rem] px-2">
            {isLimit && (
              <div className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-bold text-yellow-500 bg-yellow-500 border border-yellow-400 bg-opacity-15 rounded-xl">
                ✨ {t('product.isLimited')}
              </div>
            )}
            {isTopSell && (
              <div className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-bold border text-destructive bg-destructive/15 bg-opacity-15 border-destructive rounded-xl">
                🔥 {t('product.isTopSell')}
              </div>
            )}
            {isNew && (
              <div className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-bold text-green-500 bg-green-600 border border-green-500 bg-opacity-15 rounded-xl">
                🍃 {t('product.isNew')}
              </div>
            )}
          </div>
        )
      }
    },

    {
      id: 'actions',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tCommon('common.action')} />,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-8 h-8 p-0">
                  <span className="sr-only">{tCommon('common.action')}</span>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{tCommon('common.action')}</DropdownMenuLabel>
                <NavLink
                  to={`${ROUTE.STAFF_PRODUCT_MANAGEMENT}/${product.slug}`}
                  className="flex items-center justify-start w-full"
                >
                  <Button variant="ghost" className="flex justify-start w-full gap-1 px-2 text-sm">
                    <SquareMousePointer className="icon" />
                    {tCommon('common.viewDetail')}
                  </Button>
                </NavLink>
                <UpdateProductDialog product={product} />
                <DeleteProductDialog product={product} />
                <UploadProductImageDialog product={product} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    }
  ]
}
