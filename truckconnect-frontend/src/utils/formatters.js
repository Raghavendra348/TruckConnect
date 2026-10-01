// Utility helper functions for consistent formatting across TruckConnect

/**
 * Format ISO or date string to readable format
 * e.g., "2026-09-30T10:00:00Z" -> "30 Sep 2026, 10:00 AM"
 */
export const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format ISO or date string with time
 */
export const formatDateTime = (dateString) => formatDate(dateString, true);

/**
 * Format currency amount
 * e.g., 25000 -> "₹25,000"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

/**
 * Format weight in tons / kg
 */
export const formatWeight = (weight, unit = 'kg') => {
  if (!weight && weight !== 0) return 'N/A';
  return `${weight} ${unit}`;
};

/**
 * Format vehicle / truck registration number cleanly
 */
export const formatTruckNumber = (number) => {
  if (!number) return 'N/A';
  return String(number).toUpperCase();
};

export const formatRegistrationNumber = formatTruckNumber;
