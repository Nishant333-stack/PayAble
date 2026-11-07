// PayAble validator - JavaScript mirror of the C++ core (core/src).
// Both implementations are checked against test-vectors/cards.json so the
// browser and the native core always agree.

export const NETWORKS = [
  { id: 'visa', name: 'Visa', ranges: [[4, 4, 1]], lengths: [13, 16, 19], cvv: 3, groups: [4, 4, 4, 4, 3] },
  { id: 'mastercard', name: 'Mastercard', ranges: [[51, 55, 2], [2221, 2720, 4]], lengths: [16], cvv: 3, groups: [4, 4, 4, 4] },
  { id: 'amex', name: 'American Express', ranges: [[34, 34, 2], [37, 37, 2]], lengths: [15], cvv: 4, groups: [4, 6, 5] },
  // RuPay is checked before Discover because both use parts of the 65xxxx block.
  {
    id: 'rupay', name: 'RuPay',
    ranges: [[508500, 508999, 6], [606985, 607984, 6], [608001, 608500, 6], [652150, 653149, 6]],
    lengths: [16], cvv: 3, groups: [4, 4, 4, 4],
  },
  {
    id: 'discover', name: 'Discover',
    ranges: [[6011, 6011, 4], [644, 649, 3], [65, 65, 2], [622126, 622925, 6]],
    lengths: [16, 17, 18, 19], cvv: 3, groups: [4, 4, 4, 4, 3],
  },
];

export const MAX_YEARS_AHEAD = 20;

export const MESSAGES = {
  empty: 'Enter your card number.',
  invalidCharacters: 'Card number can only contain digits.',
  unknownNetwork: "We don't recognise this card type. Check the first digits.",
  invalidLength: 'Card number is the wrong length for this card type.',
  checksumFailed: 'Card number looks mistyped. Check each digit.',
  invalidMonth: 'Expiry month must be between 01 and 12.',
  expired: 'This card has expired.',
  tooFarInFuture: 'Expiry year is too far in the future.',
  invalidCvv: 'Security code is the wrong length.',
};

/** Strip spaces and dashes; return null if any other non-digit is present. */
export function normalizePan(input) {
  const stripped = String(input).replace(/[ -]/g, '');
  return /^\d*$/.test(stripped) ? stripped : null;
}

export function luhnCheck(digits) {
  if (!digits) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectNetwork(digits) {
  for (const n of NETWORKS) {
    for (const [low, high, width] of n.ranges) {
      if (digits.length < width) continue;
      const prefix = Number(digits.slice(0, width));
      if (prefix >= low && prefix <= high) return n;
    }
  }
  return null;
}

export function networkById(id) {
  return NETWORKS.find((n) => n.id === id) ?? null;
}

export function validateNumber(pan) {
  const result = { network: 'unknown', luhn: false, lengthOk: false, valid: false, errors: [] };
  const digits = normalizePan(pan);
  if (digits === null) {
    result.errors.push('invalidCharacters');
    return result;
  }
  if (digits === '') {
    result.errors.push('empty');
    return result;
  }
  result.luhn = luhnCheck(digits);
  const network = detectNetwork(digits);
  if (!network) {
    result.errors.push('unknownNetwork');
  } else {
    result.network = network.id;
    result.lengthOk = network.lengths.includes(digits.length);
    if (!result.lengthOk) result.errors.push('invalidLength');
  }
  if (!result.luhn) result.errors.push('checksumFailed');
  result.valid = result.errors.length === 0;
  return result;
}

/** `now` is { year, month } so tests are deterministic. */
export function validateExpiry(month, year, now) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return ['invalidMonth'];
  if (year < now.year || (year === now.year && month < now.month)) return ['expired'];
  if (year > now.year + MAX_YEARS_AHEAD) return ['tooFarInFuture'];
  return [];
}

export function validateCvv(cvv, networkId) {
  const expected = networkById(networkId)?.cvv ?? 3;
  return new RegExp(`^\\d{${expected}}$`).test(cvv) ? [] : ['invalidCvv'];
}

/** Parse "MM/YY", "MM / YY" or "MMYY" into { month, year } (four-digit year). */
export function parseExpiry(text) {
  const m = String(text).replace(/\s/g, '').match(/^(\d{1,2})\/?(\d{2})$/);
  if (!m) return null;
  return { month: Number(m[1]), year: 2000 + Number(m[2]) };
}

/** Group digits for display, e.g. Visa 4-4-4-4, Amex 4-6-5. */
export function formatPan(digits) {
  const network = detectNetwork(digits);
  const groups = network ? network.groups : [4, 4, 4, 4, 3];
  const parts = [];
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) parts.push(digits.slice(i));
  return parts.join(' ');
}
