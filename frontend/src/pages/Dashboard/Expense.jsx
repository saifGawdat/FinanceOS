import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const {
    data: expensesData,
    isLoading: loading,
    isFetching: paginationLoading,
  } = useGetExpenses({
    month,
    year,
    page: currentPage,
    limit: itemsPerPage,
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

  const isSubmitting =
    addExpenseMutation.isPending ||
    copyPreviousMonthCategoriesMutation.isPending;
  const isDeleting =
    deleteExpenseMutation.isPending || deleteExpenseCategoryMutation.isPending;
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
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to add expense. Please check your connection.";
        setError(msg);
      },
    });
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

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (isCategorySubmitting) return;
    setError("");

    addExpenseCategoryMutation.mutate(
      {
        category: categoryFormData.category,
        amount: parseFloat(categoryFormData.amount) || 0,
        month,
        year,
        description: categoryFormData.description,
      },
      {
        onSuccess: () => {
          setShowCategoryModal(false);
          setCategoryFormData({ category: "", amount: "", description: "" });
        },
        onError: (err) => {
          console.error("Error adding expense category:", err);
          setError("Failed to add expense category.");
        },
      },
    );
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
      },
    });
  };

  const confirmDeleteCategory = () => {
    if (!deleteCategoryId) return;

    deleteExpenseCategoryMutation.mutate(deleteCategoryId, {
      onSuccess: () => setDeleteCategoryId(null),
      onError: (err) => {
        console.error("Error deleting category expense:", err);
        setError("Failed to delete category expense");
      },
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
    copyPreviousMonthCategoriesMutation.mutate(
      { month, year },
      {
        onSuccess: () => {
          setCopyStatus(t("expense.copy_modal.success"));
        },
        onError: (err) => {
          console.error("Error copying categories:", err);
          setCopyStatus(
            err.response?.data?.error || t("expense.copy_modal.error_exists"),
          );
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-6 text-center md:text-left rtl:text-right">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              {t("expense.title")}
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 justify-center md:justify-start">
              <p className="text-gray-400">
                {activeTab === "expenses"
                  ? t("expense.total_transactions") + ": "
                  : t("expense.total_category") + ": "}
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
                  {t("actions.export")}
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <IoAddCircleOutline size={20} />
                  {t("actions.add")}
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
                  {t("expense.copy_past")}
                </Button>
                <Button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500"
                >
                  <IoAddCircleOutline size={20} />
                  {t("expense.add_category_spend")}
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
            {t("expense.tabs.transactions")}
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
            {t("expense.tabs.categories")}
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
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-left rtl:text-right">
                  {t("pagination.showing")} <span className="text-white">{expenses.length}</span>{" "}
                  {t("pagination.of")} <span className="text-white">{totalItems}</span> {t("pagination.transactions")}
                </div>

                {/* أزرار التنقل - Navigation Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || paginationLoading}
                    className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform rtl:rotate-180">
                      ←
                    </span>
                    <span>{t("pagination.previous")}</span>
                  </button>

                  <div className="px-6 py-3 bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl min-w-[140px] text-center shadow-inner tabular-nums">
                    {paginationLoading
                      ? t("actions.loading")
                      : t("pagination.page_x_of_y", { current: currentPage, total: totalPages })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages || paginationLoading}
                    className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                  >
                    <span>{t("pagination.next")}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform rtl:rotate-180">
                      →
                    </span>
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
                            {t("expense.category_card.virtual")}
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
                                {t("expense.category_card.monthly_budget")}
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
                            {t("expense.category_card.no_records")}
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
                  {t("expense.breakdown")}
                </h3>
                <p className="text-gray-500 text-center py-6 text-sm italic">
                  {t("expense.no_spend")}
                </p>
              </Card>
            )}
            {totalCategoryExpenses > 0 && (
              <Card className="p-8">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <IoGridOutline className="text-blue-500" size={16} />
                  </div>
                  {t("expense.system_breakdown")}
                </h3>
                <div className="space-y-8">
                  {allCategoryNames.map((categoryName) => {
                    const total = getCategoryTotal(categoryName);
                    const percentage =
                      totalCategoryExpenses > 0
                        ? (total / totalCategoryExpenses) * 100
                        : 0;

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
          title={t("expense.add_new")}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <Input
              label={t("common.title")}
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("common.title_placeholder")}
              required
            />
            <Input
              label={`${t("common.amount")} (£)`}
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2 rtl:text-right">
                {t("common.category")} <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 cursor-pointer appearance-none shadow-inner"
              >
                <option value="Other" className="bg-[#09090c] text-white">
                  {t("common.other")}
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
              label={t("common.date")}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2 rtl:text-right">
                {t("common.description")} ({t("common.optional")})
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("common.notes_placeholder")}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                rows="3"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("actions.submitting") : t("expense.add_new")}
            </Button>
          </form>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title={t("expense.add_category_spend")}
        >
          <form onSubmit={handleCategorySubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 font-semibold mb-2 rtl:text-right">
                {t("common.category")} <span className="text-red-400">*</span>
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
                placeholder={t("common.category_placeholder")}
                required
              />
              <datalist id="category-suggestions">
                {["Transportation", "Repair", "Equipment"].map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <Input
              label={`${t("common.amount")} (£)`}
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
              <label className="block text-gray-300 text-sm font-semibold mb-2 rtl:text-right">
                {t("common.description")} ({t("common.optional")})
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
                placeholder={t("common.notes_placeholder")}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isCategorySubmitting}
            >
              {isCategorySubmitting ? t("actions.submitting") : t("expense.add_category_spend")}
            </Button>
          </form>
        </Modal>

        {/* Delete Expense Confirmation Modal */}
        <Modal
          isOpen={!!deleteExpenseId}
          onClose={() => {
            if (!isDeleting) setDeleteExpenseId(null);
          }}
          title={t("modals.delete_title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 rtl:text-right font-medium leading-relaxed">
              {t("modals.delete_confirm")}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteExpenseId(null)}
                className="px-4 font-bold"
                disabled={isDeleting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteExpense}
                className="px-4 font-bold bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
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
          title={t("modals.delete_title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 rtl:text-right font-medium leading-relaxed">
              {t("modals.delete_confirm")}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteCategoryId(null)}
                className="px-4 font-bold"
                disabled={isDeleting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 font-bold bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
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
          title={t("expense.copy_modal.title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 rtl:text-right font-medium leading-relaxed">
              {t("expense.copy_modal.description", {
                prevMonth: month === 1 ? 12 : month - 1,
                prevYear: month === 1 ? year - 1 : year,
                currentMonth: month,
                currentYear: year
              })}
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
                className="px-4 font-bold"
                disabled={isSubmitting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmCopyPreviousMonthCategories}
                className="px-4 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("actions.loading") : t("expense.copy_past")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
