export const NAIRA = '₦';

export const formatCurrency = (value) => {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num).toLocaleString("en-NG");
};

export const parseCurrency = (value) => {
  return parseFloat(String(value).replace(/,/g, "")) || 0;
};

export const formatPrice = (amount) => {
  return '₦' + parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 0 });
};