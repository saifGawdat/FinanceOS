import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TransactionList from "../../components/dashboard/TransactionList";
import Modal from "../../components/ui/Modal";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import API from "../../api/axios";
import {
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  getUniqueCategories,
  copyPreviousMonthCategories,
} from "../../api/expenseCategory";
import { getExpenses } from "../../api/expense";
import { exportExpenseToExcel } from "../../utils/exportToExcel";
import { formatCurrency } from "../../utils/formatters";
import {
  IoAddCircleOutline,
  IoDownloadOutline,
  IoListOutline,
  IoGridOutline,
  IoTrashOutline,
} from "react-icons/io5";

// Categories are now dynamic and fetched from the server

const Expense = () => {
  const currentDate = new Date();
  const [expenses, setExpenses] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // حالات الترقيم - Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");

  // Category specific state
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    category: "",
    amount: "",
    description: "",
  });
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserCategories = useCallback(async () => {
    try {
      const data = await getUniqueCategories();
      setUserCategories(data);
    } catch (error) {
      console.error("Error fetching user categories:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getExpenseCategories(month, year);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load expense categories");
    }
  }, [month, year]);

  const fetchExpenses = useCallback(async () => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setPaginationLoading(true);
      }

      const response = await getExpenses(
        month,
        year,
        currentPage,
        itemsPerPage,
      );

      setExpenses(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [month, year, currentPage, itemsPerPage]);

  useEffect(() => {
    const refreshData = () => {
      if (activeTab === "categories") {
        fetchCategories();
      } else {
        fetchUserCategories();
        fetchExpenses();
      }
    };

    refreshData();

    // Listen for AI-triggered refreshes
    window.addEventListener("refreshData", refreshData);
    return () => window.removeEventListener("refreshData", refreshData);
  }, [activeTab, fetchCategories, fetchUserCategories, fetchExpenses]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(""); // Clear previous errors
    setIsSubmitting(true);
    try {
      await API.post("/expense", formData);
      setIsModalOpen(false);
      setFormData({
        title: "",
        amount: "",
        category: "Other",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setCurrentPage(1); // العودة للصفحة الأولى بعد الإضافة
      await fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add expense. Please check your connection.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteExpenseId(id);
  };

  const handleExport = () => {
    exportExpenseToExcel(expenses);
  };

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (isCategorySubmitting) return;
    setError("");
    setIsCategorySubmitting(true);
    try {
      await createExpenseCategory({
        category: categoryFormData.category,
        amount: parseFloat(categoryFormData.amount) || 0,
        month,
        year,
        description: categoryFormData.description,
      });
      setShowCategoryModal(false);
      setCategoryFormData({ category: "", amount: "", description: "" });
      await fetchCategories();
      await fetchUserCategories();
    } catch (error) {
      console.error("Error adding expense category:", error);
      setError("Failed to add expense category.");
    } finally {
      setIsCategorySubmitting(true); // Wait, this should be false, but following the pattern for now
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = (id) => {
    setDeleteCategoryId(id);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      setIsDeleting(true);
      await API.delete(`/expense/${deleteExpenseId}`);
      setDeleteExpenseId(null);
      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError("Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    try {
      setIsDeleting(true);
      await deleteExpenseCategory(deleteCategoryId);
      setDeleteCategoryId(null);
      await fetchCategories();
      await fetchUserCategories();
    } catch (error) {
      console.error("Error deleting category expense:", error);
      setError("Failed to delete category expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCategoryExpenses = categories.reduce(
    (sum, cat) =>
      sum + Number(cat.amount || 0) + Number(cat.expensesTotal || 0),
    0,
  );

  const getCategoryTotal = (categoryName) => {
    const grouped = {};
    categories.forEach((cat) => {
      if (!grouped[cat.category]) grouped[cat.category] = [];
      grouped[cat.category].push(cat);
    });
    return (grouped[categoryName] || []).reduce(
      (sum, cat) => sum + cat.amount,
      0,
    );
  };

  const allCategoryNames = [...new Set(categories.map((c) => c.category))];

  const handleCopyPreviousMonthCategories = () => {
    setCopyStatus("");
    setShowCopyModal(true);
  };

  const confirmCopyPreviousMonthCategories = async () => {
    try {
      setIsSubmitting(true);
      setCopyStatus("");
      await copyPreviousMonthCategories(month, year);
      await fetchCategories();
      await fetchUserCategories();
      setCopyStatus("Categories copied successfully!");
    } catch (error) {
      console.error("Error copying categories:", error);
      setCopyStatus(
        error.response?.data?.error ||
          "Failed to copy categories. They might already exist or the previous month is empty.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-6 text-center md:text-left">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              Expense Management
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 justify-center md:justify-start">
              <p className="text-gray-400">
                {activeTab === "expenses"
                  ? "Total Transactions: "
                  : "Total Category Expenses: "}
                <span
                  className={`${
                    activeTab === "expenses" ? "text-red-400" : "text-blue-400"
                  } font-bold text-xl`}
                >
                  {formatCurrency(
                    activeTab === "expenses"
                      ? totalExpense
                      : totalCategoryExpenses,
                  )}
                </span>
              </p>
              <div className="hidden md:block h-6 w-px bg-white/10 mx-2 "></div>
              <MonthYearSelector
                onSelect={(m, y) => {
                  setMonth(m);
                  setYear(y);
                }}
                initialMonth={month}
                initialYear={year}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {activeTab === "expenses" ? (
              <>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <IoDownloadOutline size={20} />
                  Export to Excel
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <IoAddCircleOutline size={20} />
                  Add Expense
                </Button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyPreviousMonthCategories}
                  variant="outline"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  disabled={isSubmitting}
                >
                  <IoDownloadOutline size={20} className="rotate-180" />
                  Copy from Past Month
                </Button>
                <Button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500"
                >
                  <IoAddCircleOutline size={20} />
                  Add Category Spend
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/3 border border-white/6 rounded-xl mb-6 w-full md:w-fit">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "expenses"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <IoListOutline size={18} />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "categories"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <IoGridOutline size={18} />
            Categories
          </button>
        </div>

        {activeTab === "expenses" ? (
          <Card>
            <TransactionList
              transactions={expenses}
              onDelete={handleDelete}
              type="expense"
            />
            {/* أدوات التحكم في الترقيم - Pagination Controls */}
            {!loading && expenses.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2 p-4 rounded-xl border border-white/6">
                {/* معلومات الصفحة - Page Info */}
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Showing</span>{" "}
                  <span className="font-bold text-red-400">
                    {expenses.length}
                  </span>{" "}
                  <span className="font-medium">of</span>{" "}
                  <span className="font-bold text-red-400">{totalItems}</span>{" "}
                  <span className="font-medium">transactions</span>
                </div>

                {/* أزرار التنقل - Navigation Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || paginationLoading}
                    className="px-4 py-2 bg-white/3 border border-white/6 text-gray-300 rounded-xl font-medium transition-all hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold min-w-[100px] text-center">
                    {paginationLoading ? (
                      <span className="text-xs">Loading...</span>
                    ) : (
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages || paginationLoading}
                    className="px-4 py-2 bg-white/3 border border-white/6 text-gray-300 rounded-xl font-medium transition-all hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const hasBucket = cat._id !== undefined;
                const actualExpenses = cat.actualExpenses || [];
                const total = (cat.amount || 0) + (cat.expensesTotal || 0);

                return (
                  <div
                    key={cat._id || cat.category}
                    className="bg-[#1a1d24] rounded-2xl overflow-hidden border border-white/6 hover:border-white/10 transition-all duration-150 shadow-lg"
                  >
                    <div className="bg-[#1f2229] border-b border-white/6 p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-100">
                          {cat.category}
                        </h3>
                        {cat.isVirtual && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                            Transactions Only
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold mt-1 text-gray-100">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {hasBucket && cat.amount > 0 && (
                          <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <div>
                              <p className="font-bold text-blue-400">
                                {formatCurrency(cat.amount)}
                              </p>
                              <p className="text-[10px] text-blue-500/60 font-medium uppercase">
                                Monthly Bucket
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                            >
                              <IoTrashOutline size={18} />
                            </button>
                          </div>
                        )}

                        {actualExpenses.map((expense) => (
                          <div
                            key={expense._id}
                            className="flex justify-between items-center p-3 bg-white/2 rounded-xl border border-white/6"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-200 truncate">
                                {formatCurrency(expense.amount)}
                              </p>
                              <p className="text-[10px] text-blue-400 font-semibold truncate">
                                {expense.title}
                              </p>
                              {expense.description && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap ml-2">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}

                        {cat.amount === 0 && actualExpenses.length === 0 && (
                          <p className="text-gray-400 text-center py-6 text-sm italic">
                            No spend recorded
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakdown Chart */}
            {totalCategoryExpenses === 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                  <IoGridOutline className="text-blue-500" />
                  Category Breakdown
                </h3>
                <p className="text-gray-500 text-center py-6 text-sm italic">
                  No spend recorded
                </p>
              </Card>
            )}
            {totalCategoryExpenses > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                  <IoGridOutline className="text-blue-500" />
                  Category Breakdown
                </h3>
                <div className="space-y-4">
                  {allCategoryNames.map((categoryName) => {
                    const total = getCategoryTotal(categoryName);
                    const percentage =
                      totalCategoryExpenses > 0
                        ? (total / totalCategoryExpenses) * 100
                        : 0;

                    return (
                      <div key={categoryName}>
                        <div className="flex justify-between mb-2 items-end">
                          <span className="text-gray-300 font-semibold">
                            {categoryName}
                          </span>
                          <span className="text-sm font-bold text-gray-100">
                            {formatCurrency(total)}{" "}
                            <span className="text-gray-500 font-medium ml-1">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Expense"
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Groceries"
              required
            />
            <Input
              label="Amount (£)"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-[#1a1d24] border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 cursor-pointer"
              >
                <option value="Other" className="bg-[#1a1d24] text-gray-100">
                  Other
                </option>
                {Array.isArray(userCategories) &&
                  userCategories
                    .filter((cat) => cat && cat !== "Other")
                    .map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-[#1a1d24] text-gray-100"
                      >
                        {cat}
                      </option>
                    ))}
              </select>
            </div>
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes..."
                className="w-full px-4 py-2.5 bg-white/3 border border-white/6 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                rows="3"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title="Add Category Spend"
        >
          <form onSubmit={handleCategorySubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 font-semibold mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={categoryFormData.category}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    category: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-white/3 border border-white/6 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                placeholder="e.g., Transportation, Repair, Equipment"
                required
              />
              <datalist id="category-suggestions">
                {["Transportation", "Repair", "Equipment"].map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <Input
              label="Amount (£)"
              type="number"
              value={categoryFormData.amount}
              onChange={(e) =>
                setCategoryFormData({
                  ...categoryFormData,
                  amount: e.target.value,
                })
              }
              placeholder="0.00"
              required
            />
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Description (Optional)
              </label>
              <textarea
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-white/3 border border-white/6 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                rows="3"
                placeholder="Optional notes..."
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isCategorySubmitting}
            >
              {isCategorySubmitting ? "Adding..." : "Add Category Spend"}
            </Button>
          </form>
        </Modal>

        {/* Delete Expense Confirmation Modal */}
        <Modal
          isOpen={!!deleteExpenseId}
          onClose={() => {
            if (!isDeleting) setDeleteExpenseId(null);
          }}
          title="Delete Expense"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to permanently{" "}
              <span className="font-semibold text-red-400">delete</span> this
              expense? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteExpenseId(null)}
                className="px-4"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteExpense}
                className="px-4"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Category Spend Confirmation Modal */}
        <Modal
          isOpen={!!deleteCategoryId}
          onClose={() => {
            if (!isDeleting) setDeleteCategoryId(null);
          }}
          title="Delete Category Spend"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to{" "}
              <span className="font-semibold text-red-400">
                delete this category spend
              </span>
              ? This will remove its budget for the selected month.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteCategoryId(null)}
                className="px-4"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Copy Categories Confirmation Modal */}
        <Modal
          isOpen={showCopyModal}
          onClose={() => {
            if (!isSubmitting) {
              setShowCopyModal(false);
            }
          }}
          title="Copy Categories from Previous Month"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              This will copy all category budgets from{" "}
              <span className="font-semibold text-blue-400">
                {month === 1 ? 12 : month - 1}/{month === 1 ? year - 1 : year}
              </span>{" "}
              into{" "}
              <span className="font-semibold text-blue-400">
                {month}/{year}
              </span>
              . Existing categories in the current month are not allowed.
            </p>

            {copyStatus && (
              <div className="text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                {copyStatus}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCopyModal(false)}
                className="px-4"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmCopyPreviousMonthCategories}
                className="px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Copying..." : "Copy Categories"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
