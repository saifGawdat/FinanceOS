import i18n from "../i18n";

export const formatCurrency = (amount) => {
  const val = typeof amount === 'number' ? amount : Number(amount || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(val);
};

export const formatDate = (date) => {
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
