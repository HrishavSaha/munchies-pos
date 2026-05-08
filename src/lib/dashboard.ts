import { supabase } from '@/lib/supabase'

export interface DashboardData {
  revenue:        number
  orderCount:     number
  avgOrderValue:  number
  comboAttachRate: number
  estWasteCost:   number
  paymentSplit:   { upi: number; cash: number; card: number }
  itemSales:      { name: string; qty: number; revenue: number }[]
  hourlySales:    { hour: number; revenue: number }[]
  avgServeTime:   number | null   // minutes
  topItem:        string | null
  worstItem:      string | null
}

export interface EventOption {
  id:   string
  name: string
  date: string
}

export async function fetchEvents(): Promise<EventOption[]> {
  const { data } = await supabase
    .from('events')
    .select('id, name, date')
    .order('date', { ascending: false })
  return (data ?? []) as EventOption[]
}

export async function fetchDashboardData(
  eventId: string | 'today'
): Promise<DashboardData> {
  // Build date filter
  let from: string
  let orderFilter: { column: string; value: string } | null = null

  if (eventId === 'today') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    from = start.toISOString()
  } else {
    orderFilter = { column: 'event_id', value: eventId }
    from = new Date(0).toISOString()
  }

  // Fetch orders
  let query = supabase
    .from('orders')
    .select(`
      id, subtotal, discount, total, payment_method,
      created_at, fulfilled_at,
      order_items(item_name, quantity, unit_price, menu_item_id)
    `)

  if (eventId === 'today') {
    query = query.gte('created_at', from)
  } else {
    query = query.eq('event_id', eventId)
  }

  const { data: orders } = await query

  if (!orders || orders.length === 0) {
    return emptyData()
  }

  // Revenue & orders
  const revenue      = orders.reduce((s: number, o: any) => s + o.total, 0)
  const orderCount   = orders.length
  const avgOrderValue = Math.round(revenue / orderCount)

  // Combo attach (orders with discount > 0)
  const comboOrders     = orders.filter((o: any) => o.discount > 0).length
  const comboAttachRate = Math.round((comboOrders / orderCount) * 100)

  // Payment split
  const paymentSplit = { upi: 0, cash: 0, card: 0 }
  orders.forEach((o: any) => {
    const method = o.payment_method as 'upi' | 'cash' | 'card'
    if (method in paymentSplit) paymentSplit[method]++
  })
  const toPercent = (n: number) => Math.round((n / orderCount) * 100)
  const paymentPct = {
    upi:  toPercent(paymentSplit.upi),
    cash: toPercent(paymentSplit.cash),
    card: toPercent(paymentSplit.card),
  }

  // Item sales aggregation
  const itemMap: Record<string, { qty: number; revenue: number }> = {}
  orders.forEach((o: any) => {
    o.order_items?.forEach((i: any) => {
      if (!itemMap[i.item_name]) itemMap[i.item_name] = { qty: 0, revenue: 0 }
      itemMap[i.item_name].qty     += i.quantity
      itemMap[i.item_name].revenue += i.unit_price * i.quantity
    })
  })
  const itemSales = Object.entries(itemMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.qty - a.qty)

  // Hourly sales (0–23)
  const hourlyMap: Record<number, number> = {}
  orders.forEach((o: any) => {
    const h = new Date(o.created_at).getHours()
    hourlyMap[h] = (hourlyMap[h] ?? 0) + o.total
  })
  const hourlySales = Array.from({ length: 24 }, (_, h) => ({
    hour:    h,
    revenue: hourlyMap[h] ?? 0,
  })).filter(h => h.revenue > 0)

  // Avg serve time (fulfilled orders only)
  const servedOrders = orders.filter((o: any) => o.fulfilled_at)
  const avgServeTime = servedOrders.length > 0
    ? Math.round(
        servedOrders.reduce((s: number, o: any) => {
          const ms = new Date(o.fulfilled_at).getTime() - new Date(o.created_at).getTime()
          return s + ms / 60000
        }, 0) / servedOrders.length
      )
    : null

  // Fetch stock entries for waste estimate
  let stockQuery = supabase
    .from('stock_entries')
    .select('menu_item_id, quantity_stocked, menu_items(name, cogs)')

  if (eventId !== 'today') {
    stockQuery = stockQuery.eq('event_id', eventId)
  }

  const { data: stockData } = await stockQuery
  let estWasteCost = 0

  if (stockData?.length) {
    stockData.forEach((entry: any) => {
      const sold    = itemMap[entry.menu_items?.name ?? '']?.qty ?? 0
      const unsold  = Math.max(0, entry.quantity_stocked - sold)
      estWasteCost += unsold * (entry.menu_items?.cogs ?? 0)
    })
  }

  return {
    revenue,
    orderCount,
    avgOrderValue,
    comboAttachRate,
    estWasteCost,
    paymentSplit:   paymentPct,
    itemSales,
    hourlySales,
    avgServeTime,
    topItem:   itemSales[0]?.name ?? null,
    worstItem: itemSales[itemSales.length - 1]?.name ?? null,
  }
}

function emptyData(): DashboardData {
  return {
    revenue: 0, orderCount: 0, avgOrderValue: 0,
    comboAttachRate: 0, estWasteCost: 0,
    paymentSplit: { upi: 0, cash: 0, card: 0 },
    itemSales: [], hourlySales: [],
    avgServeTime: null, topItem: null, worstItem: null,
  }
}