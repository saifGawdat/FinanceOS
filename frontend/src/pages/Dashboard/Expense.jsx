import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TransactionList from "../../components/dashboard/TransactionList";
import Modal from "../../components/ui/Modal";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import {
  useGetExpenses,
  useGetExpenseCategories,
  useGetUniqueExpenseCategories,
  useAddExpense,
  useDeleteExpense,
  useAddExpenseCategory,
  useDeleteExpenseCategory,
  useCopyPreviousMonthCategories,
} from "../../hooks/queries/useExpenses";
import { exportExpenseToExcel } from "../../utils/exportToExcel";
import { formatCurrency } from "../../utils/formatters";
import {
  IoAddCircleOutline,
  IoDownloadOutline,
  IoListOutline,
  IoGridOutline,
  IoTrashOutline,
} from "react-icons/io5";

const Expense = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  
  const [activeTab, setActiveTab] = useState("expenses");

  // Category specific state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    category: "",
    amount: "",
    description: "",
  });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);

  // Queries
  const { data: expensesData, isLoading: loading, isFetching: paginationLoading } = useGetExpenses({ 
    month, 
    year, 
    page: currentPage, 
    limit: itemsPerPage 
  });
  
  const expenses = expensesData?.data || [];
  const totalPages = expensesData?.pagination?.totalPages || 1;
  const totalItems = expensesData?.pagination?.totalItems || 0;

  const { data: categories = [] } = useGetExpenseCategories(month, year);
  const { data: userCategories = [] } = useGetUniqueExpenseCategories();

  // Mutations
  const addExpenseMutation = useAddExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const addExpenseCategoryMutation = useAddExpenseCategory();
  const deleteExpenseCategoryMutation = useDeleteExpenseCategory();
  const copyPreviousMonthCategoriesMutation = useCopyPreviousMonthCategories();

  const isSubmitting = addExpenseMutation.isPending || copyPreviousMonthCategoriesMutation.isPending;
  const isDeleting = deleteExpenseMutation.isPending || deleteExpenseCategoryMutation.isPending;
  const isCategorySubmitting = addExpenseCategoryMutation.isPending;

  useEffect(() => {
    // Listen for AI-triggered refreshes (kept for compatibility with AIAssistant)
    const refreshData = () => {
       // React Query automatically handles refetching on invalidation
    };
    window.addEventListener("refreshData", refreshData);
    return () => window.removeEventListener("refreshData", refreshData);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    
    addExpenseMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({
          title: "",
          amount: "",
          category: "Other",
          date: new Date().toISOString().split("T")[0],
          description: "",
        });
        setCurrentPage(1); 
      },
      onError: (err) => {
        console.error("Error adding expense:", err);
        const msg = err.response?.data?.error || err.response?.data?.message || "Failed to add expense. Please check your connection.";
        setError(msg);
      }
    });
  };

  const handleDelete = (id) => {
    setDeleteExpenseId(id);
  };

  const handleExport = () => {
    exportExpenseToExcel(expenses);
  };

  const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (isCategorySubmitting) return;
    setError("");
    
    addExpenseCategoryMutation.mutate({
      category: categoryFormData.category,
      amount: parseFloat(categoryFormData.amount) || 0,
      month,
      year,
      description: categoryFormData.description,
    }, {
      onSuccess: () => {
        setShowCategoryModal(false);
        setCategoryFormData({ category: "", amount: "", description: "" });
      },
      onError: (err) => {
        console.error("Error adding expense category:", err);
        setError("Failed to add expense category.");
      }
    });
  };

  const handleDeleteCategory = (id) => {
    setDeleteCategoryId(id);
  };

  const confirmDeleteExpense = () => {
    if (!deleteExpenseId) return;
    
    deleteExpenseMutation.mutate(deleteExpenseId, {
      onSuccess: () => setDeleteExpenseId(null),
      onError: (err) => {
        console.error("Error deleting expense:", err);
        setError("Failed to delete expense");
      }
    });
  };

  const confirmDeleteCategory = () => {
    if (!deleteCategoryId) return;
    
    deleteExpenseCategoryMutation.mutate(deleteCategoryId, {
      onSuccess: () => setDeleteCategoryId(null),
      onError: (err) => {
        console.error("Error deleting category expense:", err);
        setError("Failed to delete category expense");
      }
    });
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

  const confirmCopyPreviousMonthCategories = () => {
    setCopyStatus("");
    copyPreviousMonthCategoriesMutation.mutate({ month, year }, {
      onSuccess: () => {
        setCopyStatus("Categories copied successfully!");
      },
      onError: (err) => {
        console.error("Error copying categories:", err);
        setCopyStatus(
          err.response?.data?.error ||
            "Failed to copy categories. They might already exist or the previous month is empty."
        );
      }
    });
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
        <div className="flex p-1 bg-white/2 border border-white/5 rounded-xl mb-6 w-full md:w-fit backdrop-blur-md">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === "expenses"
                ? "bg-white/10 text-white shadow-lg shadow-black/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <IoListOutline size={18} />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === "categories"
                ? "bg-white/10 text-white shadow-lg shadow-black/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
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
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/2 p-6 rounded-2xl border border-white/5">
                {/* معلومات الصفحة - Page Info */}
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Showing <span className="text-white">{expenses.length}</span> of <span className="text-white">{totalItems}</span> records
                </div>

                {/* أزرار التنقل - Navigation Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || paginationLoading}
                    className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                    <span>Prev</span>
                  </button>

                  <div className="px-6 py-3 bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl min-w-[140px] text-center shadow-inner">
                    {paginationLoading ? "Syncing..." : `Page ${currentPage} / ${totalPages}`}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || paginationLoading}
                    className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                  >
                    <span>Next</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
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
                    className="bg-[#0e0e12] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 shadow-2xl group"
                  >
                    <div className="bg-white/2 border-b border-white/5 p-6">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] truncate pr-4">
                          {cat.category}
                        </h3>
                        {cat.isVirtual && (
                          <span className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-blue-500/20">
                            Virtual
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {hasBucket && cat.amount > 0 && (
                          <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 group/item hover:bg-blue-500/10 transition-colors">
                            <div>
                              <p className="text-xs font-black text-blue-500 tracking-tight">
                                {formatCurrency(cat.amount)}
                              </p>
                              <p className="text-[8px] text-blue-500/40 font-black uppercase tracking-widest">
                                Monthly Budget
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                            >
                              <IoTrashOutline size={16} />
                            </button>
                          </div>
                        )}

                        {actualExpenses.map((expense) => (
                          <div
                            key={expense._id}
                            className="flex justify-between items-center p-4 bg-white/2 rounded-xl border border-white/5 hover:bg-white/4 transition-all"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-xs font-black text-white tracking-tight">
                                {formatCurrency(expense.amount)}
                              </p>
                              <p className="text-[9px] text-gray-500 font-black truncate tracking-widest uppercase">
                                {expense.title}
                              </p>
                            </div>
                            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest tabular-nums">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}

                        {cat.amount === 0 && actualExpenses.length === 0 && (
                          <p className="text-[10px] text-gray-600 text-center py-8 font-black uppercase tracking-widest opacity-50">
                            No Records Found
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
              <Card className="p-8">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <IoGridOutline className="text-blue-500" size={16} />
                  </div>
                  System Breakdown
                </h3>
                <div className="space-y-8">
                  {allCategoryNames.map((categoryName) => {
                    const total = getCategoryTotal(categoryName);
                    const percentage = totalCategoryExpenses > 0 ? (total / totalCategoryExpenses) * 100 : 0;

                    return (
                      <div key={categoryName} className="group">
                        <div className="flex justify-between mb-3 items-end">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">
                            {categoryName}
                          </span>
                          <span className="text-[10px] font-black text-white tracking-widest uppercase">
                            {formatCurrency(total)}{" "}
                            <span className="text-blue-500 ml-2">
                              {percentage.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-white/2 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
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
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 cursor-pointer appearance-none shadow-inner"
              >
                <option value="Other" className="bg-[#09090c] text-white">
                  Other
                </option>
                {Array.isArray(userCategories) &&
                  userCategories
                    .filter((cat) => cat && cat !== "Other")
                    .map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-[#09090c] text-white"
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
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
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
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
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
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
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
