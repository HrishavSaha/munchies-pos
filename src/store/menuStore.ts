import { create } from 'zustand'
import { MenuItem, Combo } from '@/types'
import { supabase } from '@/lib/supabase'

interface MenuStore {
  items: MenuItem[]
  combos: Combo[]
  loading: boolean
  fetch: () => Promise<void>
  subscribeRealtime: () => () => void
}

export const useMenuStore = create<MenuStore>((set) => ({
  items: [],
  combos: [],
  loading: true,

  fetch: async () => {
    const [{ data: items }, { data: combos }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('is_available', true),
      supabase.from('combos').select('*, combo_items(menu_item_id)').eq('is_active', true),
    ])
    set({ items: items ?? [], combos: combos ?? [], loading: false })
  },

  subscribeRealtime: () => {
    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        useMenuStore.getState().fetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combos' }, () => {
        useMenuStore.getState().fetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combo_items' }, () => {
        useMenuStore.getState().fetch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }
}))