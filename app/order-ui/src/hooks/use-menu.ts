import {
  createMenu,
  updateMenu,
  deleteMenu,
  getAllMenus,
  getSpecificMenu,
  addMenuItem,
  addMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from '@/api'
import {
  IAddMenuItemRequest,
  ICreateMenuRequest,
  ISpecificMenuRequest,
  IUpdateMenuRequest,
  IUpdateMenuItemRequest,
} from '@/types'
import { useQuery, useMutation } from '@tanstack/react-query'

export const useAllMenus = () => {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => getAllMenus(),
  })
}

export const useSpecificMenu = (query: ISpecificMenuRequest) => {
  return useQuery({
    queryKey: ['specific-menu', query],
    queryFn: async () => getSpecificMenu(query),
  })
}

export const useCreateMenu = () => {
  return useMutation({
    mutationFn: async (data: ICreateMenuRequest) => {
      return createMenu(data)
    },
  })
}

export const useUpdateMenu = () => {
  return useMutation({
    mutationFn: async (data: IUpdateMenuRequest) => {
      return updateMenu(data)
    },
  })
}

export const useDeleteMenu = () => {
  return useMutation({
    mutationFn: async (slug: string) => {
      return deleteMenu(slug)
    },
  })
}

export const useAddMenuItem = () => {
  return useMutation({
    mutationFn: async (data: IAddMenuItemRequest) => {
      return addMenuItem(data)
    },
  })
}

export const useAddMenuItems = () => {
  return useMutation({
    mutationFn: async (data: IAddMenuItemRequest[]) => {
      return addMenuItems(data)
    },
  })
}

export const useUpdateMenuItem = () => {
  return useMutation({
    mutationFn: async (data: IUpdateMenuItemRequest) => {
      return updateMenuItem(data)
    },
  })
}

export const useDeleteMenuItem = () => {
  return useMutation({
    mutationFn: async (slug: string) => {
      return deleteMenuItem(slug)
    },
  })
}
