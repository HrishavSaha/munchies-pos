import { CartItem, Combo } from '@/types'

export function detectCombo(
  cart: CartItem[],
  combos: Combo[]
): Combo | null {
  const cartItemIds = new Set(cart.map(i => i.menu_item.id))

  const matched = combos
    .filter(combo => combo.is_active)
    .filter(combo =>
      combo.combo_items.every(ci => cartItemIds.has(ci.menu_item_id))
    )
    .sort((a, b) => b.discount_amount - a.discount_amount)

  return matched[0] ?? null
}