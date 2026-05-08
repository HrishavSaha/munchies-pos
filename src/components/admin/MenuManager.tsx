'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types'
import {
  SectionHeader, Btn, Toggle, Field, Input, Select,
  Modal, Empty, Spinner, Toast,
} from './ui'
import styles from './MenuManager.module.css'

const EMPTY_FORM: Omit<MenuItem, 'id'> = {
  name:         '',
  price:        0,
  cogs:         0,
  category:     'slider',
  emoji:        '🍔',
  is_veg:       true,
  is_available: true,
}

const CATEGORIES = ['slider', 'fries', 'dessert', 'drink']

export default function MenuManager() {
  const [items,   setItems]   = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name')
    if (error) showToast('Failed to load menu items', 'error')
    else setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel('admin-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  /* ── toggle availability ── */
  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    if (error) showToast('Failed to update', 'error')
    else showToast(`${item.name} ${!item.is_available ? 'enabled' : 'disabled'}`)
  }

  /* ── open add modal ── */
  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('add')
  }

  /* ── open edit modal ── */
  const openEdit = (item: MenuItem) => {
    setEditing(item)
    setForm({
      name:         item.name,
      price:        item.price,
      cogs:         item.cogs,
      category:     item.category,
      emoji:        item.emoji,
      is_veg:       item.is_veg,
      is_available: item.is_available,
    })
    setModal('edit')
  }

  /* ── save ── */
  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal === 'add') {
      const { error } = await supabase.from('menu_items').insert(form)
      if (error) showToast('Failed to add item', 'error')
      else { showToast(`${form.name} added`); setModal(null) }
    } else if (editing) {
      const { error } = await supabase
        .from('menu_items')
        .update(form)
        .eq('id', editing.id)
      if (error) showToast('Failed to update item', 'error')
      else { showToast(`${form.name} updated`); setModal(null) }
    }
    setSaving(false)
  }

  /* ── delete ── */
  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) showToast('Failed to delete item', 'error')
    else showToast(`${item.name} deleted`)
  }

  /* ── group by category ── */
  const grouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat)
    return acc
  }, {})

  if (loading) return <Spinner />

  return (
    <>
      <SectionHeader
        title={`Menu items (${items.length})`}
        action={<Btn variant="primary" onClick={openAdd}>+ Add item</Btn>}
      />

      {items.length === 0 && (
        <Empty message="No menu items yet. Add your first item." />
      )}

      {CATEGORIES.map(cat => {
        const catItems = grouped[cat]
        if (!catItems?.length) return null
        return (
          <div key={cat} className={styles.group}>
            <div className={styles.groupLabel}>{cat}</div>
            <div className={styles.list}>
              {catItems.map(item => (
                <div key={item.id} className={`${styles.row} ${!item.is_available ? styles.rowUnavailable : ''}`}>
                  <span className={styles.emoji}>{item.emoji}</span>

                  <div className={styles.info}>
                    <div className={styles.name}>{item.name}</div>
                    <div className={styles.meta}>
                      <span className={`${styles.vegDot} ${item.is_veg ? styles.veg : styles.non}`} />
                      {item.is_veg ? 'Veg' : 'Non veg'}
                      &nbsp;·&nbsp;
                      COGS ₹{item.cogs}
                      &nbsp;·&nbsp;
                      Margin {Math.round(((item.price - item.cogs) / item.price) * 100)}%
                    </div>
                  </div>

                  <div className={styles.price}>₹{item.price}</div>

                  <Toggle
                    checked={item.is_available}
                    onChange={() => toggleAvailable(item)}
                  />

                  <Btn size="sm" onClick={() => openEdit(item)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteItem(item)}>Delete</Btn>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add menu item' : 'Edit menu item'}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add item' : 'Save changes'}
              </Btn>
            </>
          }
        >
          <div className={styles.formGrid}>
            <Field label="Name">
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Slider Non Veg"
              />
            </Field>
            <Field label="Emoji">
              <Input
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🍔"
                maxLength={2}
              />
            </Field>
            <Field label="Price (₹)">
              <Input
                type="number" min={0}
                value={form.price || ''}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                placeholder="130"
              />
            </Field>
            <Field label="COGS (₹)">
              <Input
                type="number" min={0}
                value={form.cogs || ''}
                onChange={e => setForm(f => ({ ...f, cogs: Number(e.target.value) }))}
                placeholder="45"
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select
                value={form.is_veg ? 'veg' : 'non'}
                onChange={e => setForm(f => ({ ...f, is_veg: e.target.value === 'veg' }))}
              >
                <option value="veg">Veg</option>
                <option value="non">Non veg</option>
              </Select>
            </Field>
          </div>

          {form.price > 0 && form.cogs > 0 && (
            <div className={styles.marginPreview}>
              Gross margin: <strong>{Math.round(((form.price - form.cogs) / form.price) * 100)}%</strong>
              &nbsp;(₹{form.price - form.cogs} per unit)
            </div>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </>
  )
}