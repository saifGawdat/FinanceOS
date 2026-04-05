import React, { useMemo, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useTranslation } from "react-i18next";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { formatCurrency } from "../../utils/formatters";
import { exportGoalsToExcel } from "../../utils/exportToExcel";
import { IoAddCircleOutline, IoDownloadOutline, IoTrashOutline } from "react-icons/io5";
import {
  useGetGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from "../../hooks/queries/useGoals";

const toDateInputValue = (dateLike) => {
  if (!dateLike) return "";
  try {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const getProgressPercent = (currentAmount, targetAmount) => {
  const target = Number(targetAmount || 0);
  const current = Number(currentAmount || 0);
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
};

const Goals = () => {
  const { t } = useTranslation();
  const { data: goals = [], isLoading, error } = useGetGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteGoalId, setDeleteGoalId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [createForm, setCreateForm] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
  });

  const totalTarget = useMemo(
    () =>
      (Array.isArray(goals) ? goals : []).reduce(
        (sum, g) => sum + Number(g?.targetAmount || 0),
        0,
      ),
    [goals],
  );

  const totalCurrent = useMemo(
    () =>
      (Array.isArray(goals) ? goals : []).reduce(
        (sum, g) => sum + Number(g?.currentAmount || 0),
        0,
      ),
    [goals],
  );

  const isCreating = createGoalMutation.isPending;
  const isUpdating = updateGoalMutation.isPending;
  const isDeleting = deleteGoalMutation.isPending;

  const openEdit = (goal) => {
    setErrorMsg("");
    setEditingGoal(goal);
    setEditForm({
      title: goal?.title || "",
      targetAmount: String(goal?.targetAmount ?? ""),
      currentAmount: String(goal?.currentAmount ?? 0),
      targetDate: toDateInputValue(goal?.targetDate),
    });
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (isCreating) return;
    setErrorMsg("");

    const payload = {
      title: createForm.title?.trim(),
      targetAmount: Number(createForm.targetAmount),
      currentAmount: Number(createForm.currentAmount || 0),
      targetDate: createForm.targetDate ? createForm.targetDate : null,
    };

    createGoalMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateForm({
          title: "",
          targetAmount: "",
          currentAmount: "0",
          targetDate: "",
        });
      },
      onError: (err) => {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to create goal.";
        setErrorMsg(msg);
      },
    });
  };

  const submitUpdate = (e) => {
    e.preventDefault();
    if (!editingGoal?._id || isUpdating) return;
    setErrorMsg("");

    const payload = {
      title: editForm.title?.trim(),
      targetAmount: Number(editForm.targetAmount),
      currentAmount: Number(editForm.currentAmount || 0),
      targetDate: editForm.targetDate ? editForm.targetDate : null,
    };

    updateGoalMutation.mutate(
      { id: editingGoal._id, goal: payload },
      {
        onSuccess: () => {
          setEditingGoal(null);
        },
        onError: (err) => {
          const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Failed to update goal.";
          setErrorMsg(msg);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteGoalId || isDeleting) return;
    setErrorMsg("");

    deleteGoalMutation.mutate(deleteGoalId, {
      onSuccess: () => setDeleteGoalId(null),
      onError: (err) => {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to delete goal.";
        setErrorMsg(msg);
      },
    });
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-6 text-center md:text-left rtl:md:text-right">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              {t("goals.title")}
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 justify-center md:justify-start">
              <p className="text-gray-400">
                {t("goals.progress")}:{" "}
                <span className="text-blue-500 font-bold text-xl">
                  {formatCurrency(totalCurrent)}
                </span>{" "}
                <span className="text-gray-600">/</span>{" "}
                <span className="text-gray-200 font-bold text-xl">
                  {formatCurrency(totalTarget)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={() => exportGoalsToExcel(Array.isArray(goals) ? goals : [])}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto font-bold"
              disabled={!Array.isArray(goals) || goals.length === 0}
            >
              <IoDownloadOutline size={20} />
              {t("common.export")}
            </Button>
            <Button
              onClick={() => {
                setErrorMsg("");
                setIsCreateOpen(true);
              }}
              className="flex items-center justify-center gap-2 w-full sm:w-auto font-bold"
            >
              <IoAddCircleOutline size={20} />
              {t("goals.add_new")}
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        <Card>
          {isLoading && (
            <p className="text-gray-500 text-sm italic">{t("goals.loading")}</p>
          )}

          {!isLoading && error && (
            <p className="text-red-300 text-sm">
              Failed to load goals. Please try again.
            </p>
          )}

          {!isLoading && Array.isArray(goals) && goals.length === 0 && (
            <p className="text-gray-500 text-sm italic">{t("goals.no_goals")}</p>
          )}

          {!isLoading && Array.isArray(goals) && goals.length > 0 && (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = getProgressPercent(
                  goal?.currentAmount,
                  goal?.targetAmount,
                );
                const due = goal?.targetDate
                  ? new Date(goal.targetDate).toLocaleDateString()
                  : null;

                return (
                  <div
                    key={goal._id}
                    className="p-5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/4 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-white font-bold text-lg truncate">
                            {goal.title}
                          </h3>
                          {due && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/2 border border-white/5 px-3 py-1 rounded-full">
                              {t("goals.due")} {due}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          <span className="text-blue-400 font-semibold">
                            {formatCurrency(goal?.currentAmount || 0)}
                          </span>{" "}
                          <span className="text-gray-600">/</span>{" "}
                          <span className="text-gray-200 font-semibold">
                            {formatCurrency(goal?.targetAmount || 0)}
                          </span>
                          <span className="ml-3 text-gray-600 text-xs font-black uppercase tracking-widest">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-3 w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto font-bold"
                          onClick={() => openEdit(goal)}
                          disabled={isUpdating || isDeleting}
                        >
                          {t("actions.edit")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-300 border border-red-500/20 hover:bg-red-500/10 font-bold"
                          onClick={() => setDeleteGoalId(goal._id)}
                          disabled={isDeleting}
                        >
                          <IoTrashOutline size={16} />
                          {t("actions.delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Modal
          isOpen={isCreateOpen}
          onClose={() => {
            if (!isCreating) setIsCreateOpen(false);
          }}
          title={t("goals.form.add_title")}
        >
          <form onSubmit={submitCreate}>
            <Input
              label={t("goals.form.title")}
              name="title"
              value={createForm.title}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder={t("goals.form.placeholder")}
              required
            />
            <Input
              label={`${t("goals.form.target")} (£)`}
              type="number"
              name="targetAmount"
              value={createForm.targetAmount}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, targetAmount: e.target.value }))
              }
              placeholder="0.00"
              required
            />
            <Input
              label={`${t("goals.form.current")} (£)`}
              type="number"
              name="currentAmount"
              value={createForm.currentAmount}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, currentAmount: e.target.value }))
              }
              placeholder="0.00"
            />
            <Input
              label={t("goals.form.date")}
              type="date"
              name="targetDate"
              value={createForm.targetDate}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, targetDate: e.target.value }))
              }
            />
            <Button type="submit" className="w-full font-bold" disabled={isCreating}>
              {isCreating ? t("actions.loading") : t("goals.add_new")}
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={!!editingGoal}
          onClose={() => {
            if (!isUpdating) setEditingGoal(null);
          }}
          title={t("goals.form.edit_title")}
        >
          <form onSubmit={submitUpdate}>
            <Input
              label={t("goals.form.title")}
              name="title"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
            <Input
              label={`${t("goals.form.target")} (£)`}
              type="number"
              name="targetAmount"
              value={editForm.targetAmount}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, targetAmount: e.target.value }))
              }
              required
            />
            <Input
              label={`${t("goals.form.current")} (£)`}
              type="number"
              name="currentAmount"
              value={editForm.currentAmount}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, currentAmount: e.target.value }))
              }
            />
            <Input
              label={t("goals.form.date")}
              type="date"
              name="targetDate"
              value={editForm.targetDate}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, targetDate: e.target.value }))
              }
            />
            <Button type="submit" className="w-full font-bold" disabled={isUpdating}>
              {isUpdating ? t("actions.loading") : t("actions.save")}
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={!!deleteGoalId}
          onClose={() => {
            if (!isDeleting) setDeleteGoalId(null);
          }}
          title={t("goals.delete.title")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 rtl:text-right font-medium leading-relaxed">
              {t("goals.delete.confirm")}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteGoalId(null)}
                className="px-4 font-bold"
                disabled={isDeleting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="px-4 font-bold bg-red-600 hover:bg-red-700"
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

export default Goals;