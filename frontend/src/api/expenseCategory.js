import axios from "./axios";

// Get all expense categories with optional filtering
export const getExpenseCategories = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;

  const response = await axios.get("/expense-category", { params });
  return response.data;
};

// Get monthly expense breakdown
export const getMonthlyExpenseBreakdown = async (month, year) => {
  const response = await axios.get(
    `/expense-category/monthly/${month}/${year}`,
  );
  return response.data;
};

// Create new expense category
export const createExpenseCategory = async (categoryData) => {
  const response = await axios.post("/expense-category", categoryData);
  return response.data;
};

// Update expense category
export const updateExpenseCategory = async (id, categoryData) => {
  const response = await axios.put(`/expense-category/${id}`, categoryData);
  return response.data;
};

// Delete expense category
export const deleteExpenseCategory = async (id) => {
  const response = await axios.delete(`/expense-category/${id}`);
  return response.data;
};

// Get all unique category names for a user
export const getUniqueCategories = async () => {
  const response = await axios.get("/expense-category/unique");
  return response.data;
};

// Copy categories from previous month
export const copyPreviousMonthCategories = async (month, year) => {
  const response = await axios.post("/expense-category/copy-previous", {
    month,
    year,
  });
  return response.data;
};
