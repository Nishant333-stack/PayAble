// Shared helpers for every page.

const STORAGE_KEY = 'payable.transactions';

/** Polite screen-reader announcement via the page's live region. */
export function announce(message) {
  const region = document.getElementById('announcer');
  if (!region) return;
  // Clear first so repeating the same message is still announced.
  region.textContent = '';
  window.setTimeout(() => { region.textContent = message; }, 50);
}

export const SEED_TRANSACTIONS = [
  { reference: 'PA-SEED01', date: '2026-10-02T10:14:00Z', merchant: 'Metro Grocers', network: 'visa', last4: '1111', amount: 1840.5, status: 'Approved' },
  { reference: 'PA-SEED02', date: '2026-10-05T18:40:00Z', merchant: 'Cityline Rail', network: 'rupay', last4: '0006', amount: 220, status: 'Approved' },
  { reference: 'PA-SEED03', date: '2026-10-09T08:05:00Z', merchant: 'Chai Point Café', network: 'mastercard', last4: '4444', amount: 165, status: 'Approved' },
  { reference: 'PA-SEED04', date: '2026-10-12T21:22:00Z', merchant: 'Northwind Books', network: 'visa', last4: '1881', amount: 999, status: 'Refunded' },
  { reference: 'PA-SEED05', date: '2026-10-15T13:55:00Z', merchant: 'Sunrise Pharmacy', network: 'rupay', last4: '0009', amount: 432.75, status: 'Approved' },
  { reference: 'PA-SEED06', date: '2026-10-19T16:30:00Z', merchant: 'Skyways Airlines', network: 'amex', last4: '0005', amount: 12450, status: 'Pending' },
  { reference: 'PA-SEED07', date: '2026-10-23T11:11:00Z', merchant: 'Metro Grocers', network: 'visa', last4: '1111', amount: 2210, status: 'Approved' },
  { reference: 'PA-SEED08', date: '2026-10-27T19:48:00Z', merchant: 'Bolt Electricals', network: 'mastercard', last4: '5100', amount: 3599, status: 'Declined' },
  { reference: 'PA-SEED09', date: '2026-11-01T09:02:00Z', merchant: 'Cityline Rail', network: 'rupay', last4: '0006', amount: 220, status: 'Approved' },
  { reference: 'PA-SEED10', date: '2026-11-04T20:15:00Z', merchant: 'Lakeside Cinema', network: 'visa', last4: '1111', amount: 640, status: 'Approved' },
];

export function loadTransactions() {
  let saved = [];
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    saved = []; // storage blocked (private mode etc.) - fall back to seed data
  }
  return [...saved, ...SEED_TRANSACTIONS];
}

export function saveTransaction(tx) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    saved.unshift(tx);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 50)));
  } catch {
    // Non-essential: the demo still works without persistence.
  }
}
