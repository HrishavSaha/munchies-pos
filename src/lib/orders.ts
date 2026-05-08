import { supabase } from './supabase'
import { db } from './db'
import type { Order } from '@/types'

export async function placeOrder(order: Order): Promise<void> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine

  if (isOnline) {
    try {
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          event_id:       order.event_id,
          token_number:   order.token_number,
          payment_method: order.payment_method,
          subtotal:       order.subtotal,
          discount:       order.discount,
          total:          order.total,
        })
        .select()
        .single()

      if (error || !newOrder) throw error

      await supabase.from('order_items').insert(
        order.items.map(i => ({
          order_id:     newOrder.id,
          menu_item_id: i.menu_item.id,
          item_name:    i.menu_item.name,
          unit_price:   i.menu_item.price,
          quantity:     i.quantity,
        }))
      )
      return
    } catch {
      // fall through to offline
    }
  }

  // Save locally when offline
  await db.pendingOrders.add({ ...order, synced: false })
}