/**
 * Format paise (integer) to Indian Rupee string with Indian numbering grouping (e.g. ₹1,299.00)
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  // Use en-IN locale for Indian numbering system (lakhs, crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `₹${formatted}`;
}

/**
 * Format date/time string or Date object to IST: "18 Nov 2026, 3:45 PM IST"
 */
export function formatIST(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(date);
  
  let day = '';
  let month = '';
  let year = '';
  let hour = '';
  let minute = '';
  let dayPeriod = '';

  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'year') year = part.value;
    if (part.type === 'hour') hour = part.value;
    if (part.type === 'minute') minute = part.value;
    if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
  }

  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod} IST`;
}

/**
 * Return server error message directly per requirement (no hardcoded minutes).
 */
export function formatLockoutMessage(error: { code: string; message?: string; retryAfterSeconds?: number }): string {
  return error.message || 'An error occurred';
}
