import { db } from './db'
import { supabase } from './supabase'

export async function syncPendingOrders() {
  const pending = await db.pendingOrders
    .where('synced').equals(0).toArray()

  for (const order of pending) {
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

      if (error || !newOrder) continue

      await supabase.from('order_items').insert(
        order.items.map(i => ({
          order_id:      newOrder.id,
          menu_item_id:  i.menu_item.id,
          item_name:     i.menu_item.name,
          unit_price:    i.menu_item.price,
          quantity:      i.quantity,
        }))
      )

      await db.pendingOrders.update(order.local_id!, { synced: true })
    } catch {
      // leave unsynced, retry next time
    }
  }
}

export function startSyncListener() {
  window.addEventListener('online', syncPendingOrders)
  syncPendingOrders() // attempt immediately on load
}