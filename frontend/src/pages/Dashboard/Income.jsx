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
  useGetIncomes,
  useAddIncome,
  useDeleteIncome,
} from "../../hooks/queries/useIncome";
import { formatCurrency } from "../../utils/formatters";
import { exportIncomeToExcel } from "../../utils/exportToExcel";
import { IoAddCircleOutline, IoDownloadOutline } from "react-icons/io5";

const Income = () => {
  const { t } = useTranslation();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteIncomeId, setDeleteIncomeId] = useState(null);

  // Queries
  const {
    data: incomesData,
    isLoading: loading,
    isFetching: paginationLoading,
  } = useGetIncomes({
    month,
    year,
    page: currentPage,
    limit: itemsPerPage,
  });

  const incomes = incomesData?.data || [];
  const totalPages = incomesData?.pagination?.totalPages || 1;
  const totalItems = incomesData?.pagination?.totalItems || 0;

  // Mutations
  const addIncomeMutation = useAddIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const isSubmitting = addIncomeMutation.isPending;
  const isDeleting = deleteIncomeMutation.isPending;

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

    addIncomeMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({
          title: "",
          amount: "",
          category: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
        });
        setCurrentPage(1);
      },
      onError: (err) => {
        console.error("Error adding income:", err);
      },
    });
  };

  const handleDelete = (id) => {
    setDeleteIncomeId(id);
  };

  const confirmDeleteIncome = () => {
    if (!deleteIncomeId) return;

    deleteIncomeMutation.mutate(deleteIncomeId, {
      onSuccess: () => setDeleteIncomeId(null),
      onError: (err) => {
        console.error("Error deleting income:", err);
      },
    });
  };

  const handleExport = () => {
    exportIncomeToExcel(incomes);
  };

  const totalIncome = incomes.reduce(
    (sum, income) => sum + Number(income.amount || 0),
    0,
  );

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-6 text-center md:text-left rtl:text-right">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              {t("income.title")}
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 justify-center md:justify-start">
              <p className="text-gray-400">
                {t("income.total")}:{" "}
                <span className="text-blue-500 font-bold text-xl">
                  {formatCurrency(totalIncome)}
                </span>
              </p>
              <div className="hidden md:block h-6 w-px bg-gray-300 mx-2"></div>
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
          </div>
        </div>

        <Card>
          <TransactionList
            transactions={incomes}
            onDelete={handleDelete}
            type="income"
          />
          {/* أدوات التحكم في الترقيم - Pagination Controls */}
          {!loading && incomes.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/2 p-6 rounded-2xl border border-white/5">
              {/* معلومات الصفحة - Page Info */}
              <div className="text-sm text-gray-400">
                <span className="font-medium">{t("pagination.showing")}</span>{" "}
                <span className="font-bold text-blue-400">
                  {incomes.length}
                </span>{" "}
                <span className="font-medium">{t("pagination.of")}</span>{" "}
                <span className="font-bold text-blue-400">{totalItems}</span>{" "}
                <span className="font-medium">{t("pagination.transactions")}</span>
              </div>

              {/* أزرار التنقل - Navigation Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1 || paginationLoading}
                  className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                >
                  <span className="rtl:rotate-180">←</span>
                  <span className="hidden sm:inline">{t("pagination.previous")}</span>
                </button>

                <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold min-w-[100px] text-center tabular-nums rtl:text-right">
                  {paginationLoading ? (
                    <span className="text-xs">{t("actions.loading")}</span>
                  ) : (
                    <span>
                      {t("pagination.page_x_of_y", { current: currentPage, total: totalPages })}
                    </span>
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage >= totalPages || paginationLoading}
                  className="px-6 py-3 bg-[#09090c] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl transition-all hover:bg-white/5 disabled:opacity-20 flex items-center gap-2 group"
                >
                  <span className="hidden sm:inline">{t("pagination.next")}</span>
                  <span className="rtl:rotate-180">→</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t("income.add_new")}
        >
          <form onSubmit={handleSubmit}>
            <Input
              label={t("forms.title")}
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("forms.title_placeholder")}
              required
            />
            <Input
              label={t("forms.amount")}
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
            <Input
              label={t("forms.category")}
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder={t("forms.category_placeholder")}
              required
            />
            <Input
              label={t("forms.date")}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {t("forms.description")} ({t("forms.optional")})
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("forms.notes_placeholder")}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                rows="3"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("actions.adding") : t("income.add_new")}
            </Button>
          </form>
        </Modal>

        {/* Delete Income Confirmation Modal */}
        <Modal
          isOpen={!!deleteIncomeId}
          onClose={() => {
            if (!isDeleting) setDeleteIncomeId(null);
          }}
          title={t("income.delete_title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              {t("modals.delete_confirm")}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteIncomeId(null)}
                className="px-4"
                disabled={isDeleting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteIncome}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20"
                disabled={isDeleting}
              >
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Income;
