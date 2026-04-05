import React, { useState, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import {
  useGetRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useToggleRecurring,
  useDeleteRecurring,
} from "../../hooks/queries/useRecurring";
import { formatCurrency } from "../../utils/formatters";
import {
  IoAddCircleOutline,
  IoRepeatOutline,
  IoWalletOutline,
  IoCartOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoToggleOutline,
  IoCheckmarkCircle,
  IoPauseCircleOutline,
} from "react-icons/io5";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ORDINALS = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1;
  const suffix =
    n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return { value: n, label: `${n}${suffix}` };
});

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Rental", "Investment", "Business", "Other",
];
const EXPENSE_CATEGORIES = [
  "Housing", "Utilities", "Insurance", "Subscription", "Loan",
  "Transport", "Food", "Education", "Health", "Other",
];

const EMPTY_FORM = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  dayOfMonth: 1,
  description: "",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SummaryCard = ({ label, amount, icon, color }) => {
  const Icon = icon;
  return (
    <div
      className={`flex items-center gap-4 p-5 rounded-2xl border ${color.border} bg-linear-to-br ${color.bg}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.icon}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
          {label}
        </p>
        <p className={`text-2xl font-black ${color.text}`}>
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
};


const DayBadge = ({ day }) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
      <IoRepeatOutline size={12} className="text-gray-500" />
      {t("recurring.day_of_month", { label: ORDINALS[day - 1]?.label })}
    </span>
  );
};

const RecurringCard = ({ item, onEdit, onToggle, onDelete, isToggling, isDeleting }) => {
  const { t } = useTranslation();
  const isIncome = item.type === "income";

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-300 group ${
        item.isActive
          ? isIncome
            ? "border-emerald-500/20 bg-linear-to-br from-emerald-950/30 to-[#09090c]"
            : "border-red-500/20 bg-linear-to-br from-red-950/30 to-[#09090c]"
          : "border-white/5 bg-[#09090c] opacity-50"
      }`}
    >
      {/* Active indicator dot */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {item.isActive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("recurring.active")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            {t("recurring.paused")}
          </span>
        )}
      </div>

      {/* Category badge */}
      <span
        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 ${
          isIncome
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {item.category}
      </span>

      {/* Title */}
      <h3 className="text-base font-bold text-gray-100 mb-1 pr-12 truncate">
        {item.title}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-gray-600 mb-3 truncate">{item.description}</p>
      )}

      {/* Amount */}
      <p
        className={`text-2xl font-black mb-4 ${
          isIncome ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
      </p>

      {/* Day badge */}
      <DayBadge day={item.dayOfMonth} />

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() => onToggle(item._id)}
          disabled={isToggling}
          title={item.isActive ? "Pause" : "Resume"}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all disabled:opacity-40"
        >
          {item.isActive ? (
            <IoPauseCircleOutline size={16} />
          ) : (
            <IoCheckmarkCircle size={16} />
          )}
          {item.isActive ? t("recurring.actions.pause") : t("recurring.actions.resume")}
        </button>

        <button
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
        >
          <IoPencilOutline size={16} />
          {t("actions.edit")}
        </button>

        <button
          onClick={() => onDelete(item._id)}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
        >
          <IoTrashOutline size={16} />
          {t("actions.delete")}
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ type }) => {
  const { t } = useTranslation();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mb-5">
        <IoRepeatOutline size={36} className="text-gray-700" />
      </div>
      <h3 className="text-lg font-bold text-gray-400 mb-2">
        {t("recurring.no_records", { type: type === "income" ? t("income.title") : t("expense.title") })}
      </h3>
      <p className="text-sm text-gray-600 max-w-xs">
        {t("recurring.empty_desc")}
      </p>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const RecurringTransactions = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("expense");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: items = [], isLoading } = useGetRecurring();
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const toggleMutation = useToggleRecurring();
  const deleteMutation = useDeleteRecurring();

  // Derived data
  const incomeItems = useMemo(
    () => items.filter((i) => i.type === "income"),
    [items],
  );
  const expenseItems = useMemo(
    () => items.filter((i) => i.type === "expense"),
    [items],
  );
  const totalRecurringIncome = useMemo(
    () => incomeItems.reduce((s, i) => s + (i.isActive ? i.amount : 0), 0),
    [incomeItems],
  );
  const totalRecurringExpense = useMemo(
    () => expenseItems.reduce((s, i) => s + (i.isActive ? i.amount : 0), 0),
    [expenseItems],
  );
  const netRecurring = totalRecurringIncome - totalRecurringExpense;

  const displayedItems = activeTab === "income" ? incomeItems : expenseItems;

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, type: activeTab });
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      dayOfMonth: item.dayOfMonth,
      description: item.description || "",
    });
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "dayOfMonth" || name === "amount" ? Number(value) : value,
      // Reset category when type changes
      ...(name === "type" ? { category: "" } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: Number(formData.amount) };

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem._id, data: payload },
        { onSuccess: () => { setIsFormOpen(false); setEditingItem(null); } },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setIsFormOpen(false); setFormData(EMPTY_FORM); },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const categories =
    formData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <IoRepeatOutline size={18} className="text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-100">
                {t("recurring.title")}
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-12 rtl:mr-12 rtl:ml-0">
              {t("recurring.subtitle")}
            </p>
          </div>

          <Button
            onClick={openAdd}
            className="flex items-center gap-2 shrink-0 font-bold"
          >
            <IoAddCircleOutline size={20} />
            {t("recurring.add_new")}
          </Button>
        </div>

        {/* ── Summary Bar ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label={t("recurring.income_tab")}
            amount={totalRecurringIncome}
            icon={IoWalletOutline}
            color={{
              border: "border-emerald-500/20",
              bg: "from-emerald-950/40 to-[#09090c]",
              icon: "bg-emerald-600/30",
              text: "text-emerald-400",
            }}
          />
          <SummaryCard
            label={t("recurring.expense_tab")}
            amount={totalRecurringExpense}
            icon={IoCartOutline}
            color={{
              border: "border-red-500/20",
              bg: "from-red-950/40 to-[#09090c]",
              icon: "bg-red-600/30",
              text: "text-red-400",
            }}
          />
          <div
            className={`flex items-center gap-4 p-5 rounded-2xl border bg-linear-to-br ${
              netRecurring >= 0
                ? "border-blue-500/20 from-blue-950/40 to-[#09090c]"
                : "border-orange-500/20 from-orange-950/40 to-[#09090c]"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                netRecurring >= 0 ? "bg-blue-600/30" : "bg-orange-600/30"
              }`}
            >
              <IoRepeatOutline
                size={24}
                className={netRecurring >= 0 ? "text-blue-400" : "text-orange-400"}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                {t("recurring.net")}
              </p>
              <p
                className={`text-2xl font-black ${
                  netRecurring >= 0 ? "text-blue-400" : "text-orange-400"
                }`}
              >
                {netRecurring >= 0 ? "+" : ""}{formatCurrency(netRecurring)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 bg-white/3 border border-white/5 rounded-2xl w-fit">
          {["income", "expense"].map((tab) => {
            const count = tab === "income" ? incomeItems.length : expenseItems.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? tab === "income"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "income" ? (
                  <IoWalletOutline size={16} />
                ) : (
                  <IoCartOutline size={16} />
                )}
                {tab === "income" ? t("income.title") : t("expense.title")}
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Cards Grid ───────────────────────────────────────────────── */}
        <Card>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-white/3 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedItems.length === 0 ? (
                <EmptyState type={activeTab} />
              ) : (
                displayedItems.map((item) => (
                  <RecurringCard
                    key={item._id}
                    item={item}
                    onEdit={openEdit}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    onDelete={(id) => setDeleteId(id)}
                    isToggling={toggleMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))
              )}
            </div>
          )}
        </Card>

        {/* ── Add / Edit Modal ──────────────────────────────────────────── */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => !isSaving && setIsFormOpen(false)}
          title={editingItem ? t("recurring.edit_title") : t("recurring.add_new")}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector — only show on Add */}
            {!editingItem && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2 rtl:text-right">
                  {t("recurring.form.type")}
                </label>
                <div className="flex gap-2 p-1 bg-white/3 border border-white/5 rounded-xl">
                  {["income", "expense"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        handleChange({ target: { name: "type", value: type } })
                      }
                      className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                        formData.type === type
                          ? type === "income"
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {type === "income" ? t("income.title") : t("expense.title")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input
              label={t("recurring.form.title")}
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("common.title_placeholder")}
              required
            />

            <Input
              label={`${t("recurring.form.amount")} (£)`}
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
            />

            {/* Category select */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2 rtl:text-right">
                {t("recurring.form.category")}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 appearance-none"
              >
                <option value="" disabled className="bg-[#09090c]">
                  {t("recurring.form.select_category")}
                </option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#09090c]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of month select */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2 rtl:text-right">
                {t("recurring.form.day")}
              </label>
              <select
                name="dayOfMonth"
                value={formData.dayOfMonth}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 appearance-none"
              >
                {ORDINALS.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-[#09090c]">
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-600 mt-1.5 rtl:text-right">
                {t("recurring.form.day_hint")}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2 rtl:text-right">
                {t("common.description")}{" "}
                <span className="text-gray-600 font-normal">({t("common.optional")})</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("common.notes_placeholder")}
                rows={2}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 resize-none"
              />
            </div>

            <Button type="submit" className="w-full font-bold" disabled={isSaving}>
              {isSaving
                ? t("actions.loading")
                : editingItem
                  ? t("recurring.form.save_changes")
                  : t("recurring.form.add_recurring")}
            </Button>
          </form>
        </Modal>

        {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
        <Modal
          isOpen={!!deleteId}
          onClose={() => !deleteMutation.isPending && setDeleteId(null)}
          title={t("modals.delete_title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 rtl:text-right font-medium leading-relaxed">
              {t("modals.delete_confirm")}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="font-bold"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                disabled={deleteMutation.isPending}
                className="font-bold bg-red-600 hover:bg-red-700"
                onClick={() =>
                  deleteMutation.mutate(deleteId, {
                    onSuccess: () => setDeleteId(null),
                  })
                }
              >
                {deleteMutation.isPending ? t("actions.deleting") : t("actions.delete")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default RecurringTransactions;
