import {
  MESSAGES, normalizePan, detectNetwork, validateNumber, validateExpiry,
  validateCvv, parseExpiry, formatPan, networkById,
} from './validator.js';
import { announce, saveTransaction } from './common.js';

const form = document.getElementById('checkout-form');
const fields = {
  name: document.getElementById('cc-name'),
  number: document.getElementById('cc-number'),
  expiry: document.getElementById('cc-exp'),
  cvv: document.getElementById('cc-csc'),
};
const summary = document.getElementById('error-summary');
const summaryList = document.getElementById('error-summary-list');
const networkBadge = document.getElementById('cc-network');
const networkName = document.getElementById('cc-network-name');
const touched = new Set();
let lastAnnouncedNetwork = 'unknown';

function today() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

// --- Validation rules: each returns an error message or '' ---------------

const rules = {
  name(value) {
    const v = value.trim();
    if (!v) return 'Enter the name as it appears on your card.';
    if (v.length < 2) return 'Name on card must be at least 2 characters.';
    return '';
  },
  number(value) {
    const r = validateNumber(value);
    return r.valid ? '' : MESSAGES[r.errors[0]];
  },
  expiry(value) {
    if (!value.trim()) return 'Enter the expiry date.';
    const parsed = parseExpiry(value);
    if (!parsed) return 'Enter the expiry date as month and year, like 04 / 29.';
    const errors = validateExpiry(parsed.month, parsed.year, today());
    return errors.length ? MESSAGES[errors[0]] : '';
  },
  cvv(value) {
    const network = currentNetwork();
    if (!value) return 'Enter the security code.';
    const errors = validateCvv(value, network?.id ?? 'unknown');
    if (!errors.length) return '';
    const len = network?.cvv ?? 3;
    return `Security code must be ${len} digits.`;
  },
};

function currentNetwork() {
  const digits = normalizePan(fields.number.value) ?? '';
  return detectNetwork(digits);
}

function showError(key, message) {
  const input = fields[key];
  const error = document.getElementById(`${input.id}-error`);
  const wrapper = input.closest('.field');
  if (message) {
    // The visible "Error:" prefix means the state is not conveyed by colour alone (WCAG 1.4.1).
    error.innerHTML = `<span class="error-prefix">Error:</span> ${message}`;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    wrapper.classList.add('has-error');
  } else {
    error.textContent = '';
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    wrapper.classList.remove('has-error');
  }
}

function validateField(key) {
  const message = rules[key](fields[key].value);
  showError(key, message);
  return message;
}

// --- Live formatting ------------------------------------------------------

// Re-format while keeping the caret after the same number of digits, so
// typing in the middle of the number doesn't throw the cursor to the end.
function reformat(input, formatter) {
  const caret = input.selectionStart ?? input.value.length;
  const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;
  const formatted = formatter(input.value.replace(/\D/g, ''));
  input.value = formatted;
  let pos = 0;
  let seen = 0;
  while (pos < formatted.length && seen < digitsBeforeCaret) {
    if (/\d/.test(formatted[pos])) seen++;
    pos++;
  }
  if (document.activeElement === input) input.setSelectionRange(pos, pos);
}

function formatExpiry(digits) {
  const d = digits.slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)} / ${d.slice(2)}`;
}

function updateNetwork() {
  const network = currentNetwork();
  const id = network?.id ?? 'unknown';
  networkBadge.dataset.network = id;
  networkName.textContent = network ? network.name : 'not detected yet';

  const cvvLen = network?.cvv ?? 3;
  fields.cvv.maxLength = cvvLen;
  document.getElementById('cvv-length').textContent = String(cvvLen);
  document.getElementById('cvv-location').textContent = id === 'amex' ? 'front' : 'back';

  // Only announce when the detected type changes, to avoid chatter on every keystroke.
  if (id !== lastAnnouncedNetwork) {
    lastAnnouncedNetwork = id;
    if (network) announce(`${network.name} card detected.`);
  }
}

fields.number.addEventListener('input', () => {
  reformat(fields.number, (d) => formatPan(d.slice(0, 19)));
  updateNetwork();
  if (touched.has('number')) validateField('number');
});

fields.expiry.addEventListener('input', (e) => {
  // Let backspace remove the separator naturally.
  if (e.inputType === 'deleteContentBackward' && fields.expiry.value.endsWith(' /')) {
    fields.expiry.value = fields.expiry.value.slice(0, -2);
  }
  reformat(fields.expiry, formatExpiry);
  if (touched.has('expiry')) validateField('expiry');
});

fields.cvv.addEventListener('input', () => {
  fields.cvv.value = fields.cvv.value.replace(/\D/g, '');
  if (touched.has('cvv')) validateField('cvv');
});

fields.name.addEventListener('input', () => {
  if (touched.has('name')) validateField('name');
});

// Validate on blur, not while the person is still typing (less noise for
// screen reader users and less anxiety for everyone).
for (const key of Object.keys(fields)) {
  fields[key].addEventListener('blur', (e) => {
    if (!fields[key].value && !touched.has(key)) return;
    // If focus is moving to the Pay button, let submit validate everything.
    // Showing the error here would shift the layout mid-click and the press
    // would land on empty space (caught by the tablet-width browser test).
    if (e.relatedTarget?.id === 'pay-button') return;
    touched.add(key);
    validateField(key);
  });
}

// --- Submit ----------------------------------------------------------------

function renderSummary(errors) {
  summaryList.innerHTML = '';
  for (const { key, message } of errors) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${fields[key].id}`;
    a.textContent = message;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const input = fields[key];
      input.closest('.field').scrollIntoView({ block: 'center' });
      input.focus({ preventScroll: true });
    });
    li.append(a);
    summaryList.append(li);
  }
  summary.hidden = errors.length === 0;
  document.title = errors.length ? `Error: Checkout – PayAble` : 'Checkout – PayAble';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const errors = [];
  for (const key of Object.keys(fields)) {
    touched.add(key);
    const message = validateField(key);
    if (message) errors.push({ key, message });
  }
  renderSummary(errors);
  if (errors.length) {
    summary.focus();
    return;
  }
  complete();
});

function complete() {
  const network = currentNetwork();
  const digits = normalizePan(fields.number.value);
  const reference = `PA-${Date.now().toString(36).toUpperCase()}`;
  saveTransaction({
    reference,
    date: new Date().toISOString(),
    merchant: 'PayAble annual plan',
    network: network.id,
    last4: digits.slice(-4),
    amount: 2499,
    status: 'Approved',
  });

  document.getElementById('reference').textContent = reference;
  document.getElementById('confirm-detail').textContent =
    `We charged ₹2,499.00 to your ${network.name} card ending ${digits.slice(-4)}.`;
  document.getElementById('pay-panel').hidden = true;
  document.querySelector('.summary').hidden = true;
  const confirmation = document.getElementById('confirmation');
  confirmation.hidden = false;
  document.title = 'Payment complete – PayAble';
  // Move focus to the new heading so screen reader and keyboard users land on the result.
  document.getElementById('confirm-heading').focus();
}

document.getElementById('new-payment').addEventListener('click', () => {
  form.reset();
  touched.clear();
  for (const key of Object.keys(fields)) showError(key, '');
  renderSummary([]);
  updateNetwork();
  document.getElementById('confirmation').hidden = true;
  document.getElementById('pay-panel').hidden = false;
  document.querySelector('.summary').hidden = false;
  document.title = 'Checkout – PayAble';
  fields.name.focus();
});

// Expose for debugging in the console.
window.payable = { networkById };
