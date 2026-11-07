import { loadTransactions, announce } from './common.js';
import { networkById } from './validator.js';

const all = loadTransactions();
const body = document.getElementById('tx-body');
const count = document.getElementById('result-count');
const search = document.getElementById('search');
const status = document.getElementById('status');
const headers = [...document.querySelectorAll('th[data-key]')];
let sort = { key: 'date', dir: 'descending' };

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function filterAndSort(rows, { query, statusFilter, key, dir }) {
  const q = query.trim().toLowerCase();
  const out = rows.filter((t) =>
    (!statusFilter || t.status === statusFilter) &&
    (!q || t.merchant.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)));
  const sign = dir === 'ascending' ? 1 : -1;
  out.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number') return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
  return out;
}

function current() {
  return filterAndSort(all, { query: search.value, statusFilter: status.value, key: sort.key, dir: sort.dir });
}

function render() {
  const rows = current();
  body.innerHTML = '';
  for (const t of rows) {
    const tr = document.createElement('tr');
    const network = networkById(t.network)?.name ?? t.network;
    const time = document.createElement('time');
    time.dateTime = t.date;
    time.textContent = dateFmt.format(new Date(t.date));
    const cells = [
      time,
      t.merchant,
      `${network} ending ${t.last4}`,
      Object.assign(document.createElement('span'), {
        className: `status status-${t.status.toLowerCase()}`,
        textContent: t.status,
      }),
      money.format(t.amount),
    ];
    cells.forEach((content, i) => {
      const td = document.createElement('td');
      if (i === 4) td.className = 'num';
      td.append(content);
      tr.append(td);
    });
    body.append(tr);
  }
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No transactions match your filters.';
    tr.append(td);
    body.append(tr);
  }
  count.textContent = `Showing ${rows.length} of ${all.length} transactions.`;
}

for (const th of headers) {
  th.querySelector('button').addEventListener('click', () => {
    const key = th.dataset.key;
    const dir = sort.key === key && sort.dir === 'ascending' ? 'descending' : 'ascending';
    sort = { key, dir };
    for (const h of headers) h.setAttribute('aria-sort', h === th ? dir : 'none');
    render();
    announce(`Sorted by ${th.textContent.trim()}, ${dir}.`);
  });
}

search.addEventListener('input', render);
status.addEventListener('change', render);
document.getElementById('filters').addEventListener('submit', (e) => e.preventDefault());

document.getElementById('export').addEventListener('click', () => {
  const rows = current();
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [['Reference', 'Date', 'Merchant', 'Network', 'Last 4', 'Status', 'Amount (INR)'].map(esc).join(',')];
  for (const t of rows) {
    lines.push([t.reference, t.date.slice(0, 10), t.merchant, t.network, t.last4, t.status, t.amount].map(esc).join(','));
  }
  // The BOM makes Excel open the file as UTF-8 so the ₹ and accented names survive.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'payable-transactions.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  announce(`Exported ${rows.length} transactions.`);
});

render();
