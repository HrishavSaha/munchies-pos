'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types'
import {
  SectionHeader, Btn, Field, Input, Select,
  Empty, Spinner, Toast,
} from './ui'
import styles from './StockManager.module.css'

interface EventOption {
  id:        string
  name:      string
  date:      string
  is_active: boolean
}

interface StockRow {
  menu_item_id:     string
  quantity_stocked: number
}

export default function StockManager() {
  const [events,     setEvents]     = useState<EventOption[]>([])
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([])
  const [eventId,    setEventId]    = useState<string>('')
  const [stock,      setStock]      = useState<Record<string, number>>({})
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [newEvent,   setNewEvent]   = useState({ name: '', date: today() })
  const [creating,   setCreating]   = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load events and menu items
  const loadBase = useCallback(async () => {
    const [{ data: evData }, { data: itemData }] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase.from('menu_items').select('*').order('category').order('name'),
    ])
    const evList = (evData ?? []) as EventOption[]
    setEvents(evList)
    setMenuItems((itemData ?? []) as MenuItem[])

    // Auto-select active event or most recent
    const active = evList.find(e => e.is_active) ?? evList[0]
    if (active && !eventId) setEventId(active.id)
    setLoading(false)
  }, [eventId])

  useEffect(() => { loadBase() }, [loadBase])

  // Load stock for selected event
  const loadStock = useCallback(async () => {
    if (!eventId) return
    const { data } = await supabase
      .from('stock_entries')
      .select('menu_item_id, quantity_stocked')
      .eq('event_id', eventId)

    const map: Record<string, number> = {}
    ;(data ?? []).forEach((row: StockRow) => {
      map[row.menu_item_id] = row.quantity_stocked
    })
    setStock(map)
  }, [eventId])

  useEffect(() => { loadStock() }, [loadStock])

  // Save stock entries (upsert)
  const save = async () => {
    if (!eventId) return
    setSaving(true)

    const rows = menuItems
      .filter(item => (stock[item.id] ?? 0) > 0)
      .map(item => ({
        event_id:         eventId,
        menu_item_id:     item.id,
        quantity_stocked: stock[item.id] ?? 0,
      }))

    // Delete existing entries for this event then re-insert
    await supabase.from('stock_entries').delete().eq('event_id', eventId)

    if (rows.length > 0) {
      const { error } = await supabase.from('stock_entries').insert(rows)
      if (error) { showToast('Failed to save stock', 'error'); setSaving(false); return }
    }

    showToast('Stock saved')
    setSaving(false)
  }

  // Create new event
  const createEvent = async () => {
    if (!newEvent.name.trim()) return
    setCreating(true)

    // Deactivate all existing events
    await supabase.from('events').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')

    const { data, error } = await supabase
      .from('events')
      .insert({ name: newEvent.name, date: newEvent.date, is_active: true })
      .select()
      .single()

    if (error || !data) {
      showToast('Failed to create event', 'error')
    } else {
      showToast(`${newEvent.name} created and set as active`)
      setNewEvent({ name: '', date: today() })
      setEventId(data.id)
      await loadBase()
    }
    setCreating(false)
  }

  // Set event as active
  const setActive = async (id: string) => {
    await supabase.from('events').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('events').update({ is_active: true }).eq('id', id)
    await loadBase()
    showToast('Active event updated')
  }

  const totalUnits = Object.values(stock).reduce((s, v) => s + v, 0)

  if (loading) return <Spinner />

  return (
    <>
      {/* ── Events ── */}
      <div className={styles.section}>
        <SectionHeader
          title="Events"
          action={null}
        />

        {events.length === 0 && (
          <Empty message="No events yet. Create your first event below." />
        )}

        <div className={styles.eventList}>
          {events.map(ev => (
            <div
              key={ev.id}
              className={`${styles.eventRow} ${eventId === ev.id ? styles.eventRowSelected : ''}`}
              onClick={() => setEventId(ev.id)}
            >
              <div className={styles.eventInfo}>
                <div className={styles.eventName}>{ev.name}</div>
                <div className={styles.eventDate}>
                  {new Date(ev.date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
              </div>
              <div className={styles.eventActions}>
                {ev.is_active && (
                  <span className={styles.activeBadge}>Active</span>
                )}
                {!ev.is_active && eventId === ev.id && (
                  <Btn size="sm" onClick={(e) => { e.stopPropagation(); setActive(ev.id) }}>
                    Set active
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create event */}
        <div className={styles.createEvent}>
          <div className={styles.createTitle}>New event</div>
          <div className={styles.createRow}>
            <Field label="Event name">
              <Input
                value={newEvent.name}
                onChange={e => setNewEvent(n => ({ ...n, name: e.target.value }))}
                placeholder="e.g. HSR Flea Market"
              />
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))}
              />
            </Field>
            <div className={styles.createBtnWrap}>
              <Btn
                variant="primary"
                onClick={createEvent}
                disabled={creating || !newEvent.name.trim()}
              >
                {creating ? 'Creating…' : 'Create & activate'}
              </Btn>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Stock entry ── */}
      <div className={styles.section}>
        <SectionHeader
          title={eventId
            ? `Stock entry · ${events.find(e => e.id === eventId)?.name ?? ''}`
            : 'Stock entry'
          }
          action={
            <div className={styles.saveRow}>
              {totalUnits > 0 && (
                <span className={styles.totalUnits}>{totalUnits} total units</span>
              )}
              <Btn
                variant="primary"
                onClick={save}
                disabled={saving || !eventId}
              >
                {saving ? 'Saving…' : 'Save stock'}
              </Btn>
            </div>
          }
        />

        {!eventId && (
          <Empty message="Select or create an event above to enter stock." />
        )}

        {eventId && (
          <div className={styles.stockTable}>
            <div className={styles.stockHeader}>
              <span>Item</span>
              <span>Units to bring</span>
              <span>Est. revenue if sold out</span>
            </div>
            {menuItems.map(item => {
              const qty = stock[item.id] ?? 0
              const estRev = qty * item.price
              return (
                <div key={item.id} className={styles.stockRow}>
                  <div className={styles.stockItem}>
                    <span className={styles.stockEmoji}>{item.emoji}</span>
                    <div>
                      <div className={styles.stockName}>{item.name}</div>
                      <div className={styles.stockMeta}>₹{item.price} · COGS ₹{item.cogs}</div>
                    </div>
                  </div>
                  <div className={styles.qtyInput}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setStock(s => ({ ...s, [item.id]: Math.max(0, (s[item.id] ?? 0) - 5) }))}
                    >−</button>
                    <input
                      className={styles.qtyField}
                      type="number"
                      min={0}
                      value={qty || ''}
                      placeholder="0"
                      onChange={e => setStock(s => ({ ...s, [item.id]: Math.max(0, Number(e.target.value)) }))}
                    />
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setStock(s => ({ ...s, [item.id]: (s[item.id] ?? 0) + 5 }))}
                    >+</button>
                  </div>
                  <div className={styles.estRev}>
                    {qty > 0 ? `₹${estRev.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
              )
            })}

            {/* Totals row */}
            {totalUnits > 0 && (
              <div className={styles.stockTotals}>
                <span>Total</span>
                <span>{totalUnits} units</span>
                <span>
                  ₹{menuItems
                    .reduce((s, item) => s + (stock[item.id] ?? 0) * item.price, 0)
                    .toLocaleString('en-IN')} potential revenue
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </>
  )
}