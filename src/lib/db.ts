import Dexie, { Table } from 'dexie'
import { Order } from '@/types'

interface PendingOrder extends Order {
  synced: boolean
  local_id?: number
}

class MunchiesDB extends Dexie {
  pendingOrders!: Table<PendingOrder>

  constructor() {
    super('munchiesDB')
    this.version(1).stores({
      pendingOrders: '++local_id, synced, token_number'
    })
  }
}

export const db = new MunchiesDB()