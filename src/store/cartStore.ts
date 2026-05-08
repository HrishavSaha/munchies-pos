import { create } from 'zustand'
import { CartItem, MenuItem, Combo } from '@/types'

interface CartStore {
  items: CartItem[]
  appliedCombo: Combo | null
  tokenNumber: number
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, delta: number) => void
  setCombo: (combo: Combo | null) => void
  clearCart: () => void
  subtotal: () => number
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  appliedCombo: null,
  tokenNumber: 1,

  addItem: (item) => {
    const existing = get().items.find(i => i.menu_item.id === item.id)
    if (existing) {
      set(s => ({ items: s.items.map(i =>
        i.menu_item.id === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )}))
    } else {
      set(s => ({ items: [...s.items, { menu_item: item, quantity: 1 }] }))
    }
  },

  removeItem: (id) =>
    set(s => ({ items: s.items.filter(i => i.menu_item.id !== id) })),

  updateQty: (id, delta) =>
    set(s => ({
      items: s.items
        .map(i => i.menu_item.id === id
          ? { ...i, quantity: i.quantity + delta }
          : i
        )
        .filter(i => i.quantity > 0)
    })),

  setCombo: (combo) => set({ appliedCombo: combo }),

  clearCart: () => set(s => ({
    items: [],
    appliedCombo: null,
    tokenNumber: s.tokenNumber + 1
  })),

  subtotal: () =>
    get().items.reduce((s, i) => s + i.menu_item.price * i.quantity, 0),

  total: () => {
    const s = get().subtotal()
    const d = get().appliedCombo?.discount_amount ?? 0
    return s - d
  }
}))