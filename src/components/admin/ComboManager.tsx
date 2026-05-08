'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem, Combo } from '@/types'
import {
  SectionHeader, Btn, Toggle, Field, Input,
  Modal, Empty, Spinner, Toast,
} from './ui'
import styles from './ComboManager.module.css'

interface ComboForm {
  name:            string
  discount_amount: number
  is_active:       boolean
  item_ids:        string[]
}

const EMPTY_FORM: ComboForm = {
  name:            '',
  discount_amount: 0,
  is_active:       true,
  item_ids:        [],
}

export default function ComboManager() {
  const [combos,    setCombos]    = useState<Combo[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<'add' | 'edit' | null>(null)
  const [editing,   setEditing]   = useState<Combo | null>(null)
  const [form,      setForm]      = useState<ComboForm>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: combosData }, { data: itemsData }] = await Promise.all([
      supabase
        .from('combos')
        .select('*, combo_items(menu_item_id)')
        .order('created_at'),
      supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name'),
    ])
    setCombos(combosData ?? [])
    setMenuItems(itemsData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('admin-combos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combos' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combo_items' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  /* ── toggle active ── */
  const toggleActive = async (combo: Combo) => {
    const { error } = await supabase
      .from('combos')
      .update({ is_active: !combo.is_active })
      .eq('id', combo.id)
    if (error) showToast('Failed to update', 'error')
    else showToast(`${combo.name} ${!combo.is_active ? 'activated' : 'deactivated'}`)
  }

  /* ── open add ── */
  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('add')
  }

  /* ── open edit ── */
  const openEdit = (combo: Combo) => {
    setEditing(combo)
    setForm({
      name:            combo.name,
      discount_amount: combo.discount_amount,
      is_active:       combo.is_active,
      item_ids:        combo.combo_items.map(ci => ci.menu_item_id),
    })
    setModal('edit')
  }

  /* ── save ── */
  const save = async () => {
    if (!form.name.trim() || form.discount_amount <= 0 || form.item_ids.length < 2) return
    setSaving(true)

    if (modal === 'add') {
      const { data: newCombo, error: comboErr } = await supabase
        .from('combos')
        .insert({
          name:            form.name,
          discount_amount: form.discount_amount,
          is_active:       form.is_active,
        })
        .select()
        .single()

      if (comboErr || !newCombo) {
        showToast('Failed to create combo', 'error')
        setSaving(false)
        return
      }

      const { error: itemsErr } = await supabase
        .from('combo_items')
        .insert(form.item_ids.map(id => ({ combo_id: newCombo.id, menu_item_id: id })))

      if (itemsErr) showToast('Combo created but items failed to link', 'error')
      else { showToast(`${form.name} created`); setModal(null) }

    } else if (editing) {
      const { error: comboErr } = await supabase
        .from('combos')
        .update({
          name:            form.name,
          discount_amount: form.discount_amount,
          is_active:       form.is_active,
        })
        .eq('id', editing.id)

      if (comboErr) {
        showToast('Failed to update combo', 'error')
        setSaving(false)
        return
      }

      /* replace combo_items */
      await supabase.from('combo_items').delete().eq('combo_id', editing.id)
      const { error: itemsErr } = await supabase
        .from('combo_items')
        .insert(form.item_ids.map(id => ({ combo_id: editing.id, menu_item_id: id })))

      if (itemsErr) showToast('Combo updated but items failed to link', 'error')
      else { showToast(`${form.name} updated`); setModal(null) }
    }

    setSaving(false)
  }

  /* ── delete ── */
  const deleteCombo = async (combo: Combo) => {
    if (!confirm(`Delete "${combo.name}"?`)) return
    /* combo_items cascade on delete */
    const { error } = await supabase.from('combos').delete().eq('id', combo.id)
    if (error) showToast('Failed to delete', 'error')
    else showToast(`${combo.name} deleted`)
  }

  /* ── toggle item in form ── */
  const toggleItemId = (id: string) => {
    setForm(f => ({
      ...f,
      item_ids: f.item_ids.includes(id)
        ? f.item_ids.filter(i => i !== id)
        : [...f.item_ids, id],
    }))
  }

  /* ── get item name by id ── */
  const itemName = (id: string) =>
    menuItems.find(i => i.id === id)?.name ?? id

  if (loading) return <Spinner />

  return (
    <>
      <SectionHeader
        title={`Combos & offers (${combos.length})`}
        action={<Btn variant="primary" onClick={openAdd}>+ New combo</Btn>}
      />

      {combos.length === 0 && (
        <Empty message="No combos yet. Create your first combo offer." />
      )}

      <div className={styles.list}>
        {combos.map(combo => {
          const linkedIds = combo.combo_items.map(ci => ci.menu_item_id)
          return (
            <div key={combo.id} className={`${styles.card} ${!combo.is_active ? styles.cardInactive : ''}`}>
              <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{combo.name}</div>
                  <div className={styles.cardItems}>
                    {linkedIds.map(id => itemName(id)).join(' + ')}
                  </div>
                </div>
                <div className={styles.cardDiscount}>
                  −₹{combo.discount_amount}
                  <span className={styles.discountLabel}>off</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.toggleRow}>
                  <Toggle
                    checked={combo.is_active}
                    onChange={() => toggleActive(combo)}
                  />
                  <span className={styles.toggleLabel}>
                    {combo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <Btn size="sm" onClick={() => openEdit(combo)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteCombo(combo)}>Delete</Btn>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? 'New combo' : 'Edit combo'}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn onClick={() => setModal(null)}>Cancel</Btn>
              <Btn
                variant="primary"
                onClick={save}
                disabled={
                  saving ||
                  !form.name.trim() ||
                  form.discount_amount <= 0 ||
                  form.item_ids.length < 2
                }
              >
                {saving ? 'Saving…' : modal === 'add' ? 'Create combo' : 'Save changes'}
              </Btn>
            </>
          }
        >
          <Field label="Combo name">
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Slider + Fries + Coke"
            />
          </Field>

          <Field label="Discount amount (₹)">
            <Input
              type="number" min={1}
              value={form.discount_amount || ''}
              onChange={e => setForm(f => ({ ...f, discount_amount: Number(e.target.value) }))}
              placeholder="30"
            />
          </Field>

          <Field label="Required items (select 2 or more)">
            <div className={styles.itemPicker}>
              {menuItems.map(item => {
                const selected = form.item_ids.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItemId(item.id)}
                    className={`${styles.itemChip} ${selected ? styles.itemChipSelected : ''}`}
                  >
                    {item.emoji} {item.name}
                    {selected && <span className={styles.chipCheck}>✓</span>}
                  </button>
                )
              })}
            </div>
          </Field>

          {form.item_ids.length >= 2 && form.discount_amount > 0 && (
            <div className={styles.preview}>
              <div className={styles.previewLabel}>Preview</div>
              <div className={styles.previewText}>
                {form.item_ids.map(id => itemName(id)).join(' + ')}
                {' = '}
                <strong>₹{form.discount_amount} off</strong>
              </div>
            </div>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </>
  )
}