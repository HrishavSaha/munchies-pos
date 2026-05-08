export interface MenuItem {
  id: string
  name: string
  price: number
  cogs: number
  category: string
  emoji: string
  is_veg: boolean
  is_available: boolean
}

export interface Combo {
  id: string
  name: string
  discount_amount: number
  is_active: boolean
  combo_items: { menu_item_id: string }[]
}

export interface CartItem {
  menu_item: MenuItem
  quantity: number
}

export interface Order {
  id?: string
  event_id: string | null
  token_number: number
  payment_method: string
  subtotal: number
  discount: number
  total: number
  items: CartItem[]
}

export interface Event {
  id: string
  name: string
  date: string
  is_active: boolean
}

export interface StockEntry {
  menu_item_id: string
  quantity_stocked: number
}