// Format number ke currency Indonesia
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number dengan titik pemisah ribuan
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

// Parse currency string ke number
export function parseCurrency(value: string): number {
  // Hapus semua karakter selain angka
  const cleanValue = value.replace(/[^\d]/g, '');
  return parseInt(cleanValue) || 0;
}

// Format input saat user mengetik
export function formatCurrencyInput(value: string): string {
  const numericValue = parseCurrency(value);
  if (numericValue === 0) return '';
  return formatNumber(numericValue);
}

// Validasi minimum amount
export function validateAmount(amount: number, min = 1): boolean {
  return amount >= min;
}