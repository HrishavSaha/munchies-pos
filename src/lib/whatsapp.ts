import { CartItem, Combo } from '@/types'

export function buildReceiptText(
  tokenNumber: number,
  items: CartItem[],
  subtotal: number,
  discount: number,
  total: number,
  paymentMethod: string,
  appliedCombo: Combo | null
): string {
  const lines = items
    .map(i => `${i.quantity}x ${i.menu_item.name.padEnd(18)} ₹${i.menu_item.price * i.quantity}`)
    .join('\n')

  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return [
    `Munchies & Co.`,
    `${'─'.repeat(30)}`,
    `Order #${String(tokenNumber).padStart(3, '0')}`,
    date,
    ``,
    lines,
    `${'─'.repeat(30)}`,
    `Subtotal${' '.repeat(14)}₹${subtotal}`,
    appliedCombo ? `Combo discount   -₹${discount}` : null,
    `TOTAL${' '.repeat(17)}₹${total}`,
    ``,
    `Payment: ${paymentMethod.toUpperCase()}`,
    `${'─'.repeat(30)}`,
    `Follow us @munchiesandco`,
  ].filter(Boolean).join('\n')
}

export function openWhatsApp(phone: string, receiptText: string) {
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(receiptText)}`
  window.open(url, '_blank')
}