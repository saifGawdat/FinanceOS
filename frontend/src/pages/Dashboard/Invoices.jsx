import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import SummaryCard from "../../components/dashboard/SummaryCard";
import { customerAPI } from "../../api/customer";
import {
  useCancelInvoice,
  useCreateInvoice,
  useGetInvoice,
  useGetInvoiceAging,
  useGetInvoices,
  useGetInvoiceSummary,
  useRecordInvoicePayment,
  useSendInvoice,
  useUpdateInvoice,
} from "../../hooks/queries/useInvoices";
import { formatCurrency, formatDate } from "../../utils/formatters";
import {
  IoAddOutline,
  IoAlertCircleOutline,
  IoCashOutline,
  IoCheckmarkCircleOutline,
  IoCreateOutline,
  IoEyeOutline,
  IoReceiptOutline,
  IoSendOutline,
  IoTrashOutline,
} from "react-icons/io5";

const initialInvoiceForm = {
  customerId: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date().toISOString().split("T")[0],
  tax: "0",
  discount: "0",
  notes: "",
  lineItems: [{ description: "", quantity: "1", unitPrice: "0" }],
};

const initialPaymentForm = {
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  method: "bank transfer",
  reference: "",
  notes: "",
};

const statusClasses = {
  draft: "bg-white/5 text-gray-300 border-white/10",
  sent: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  partially_paid: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-300 border-red-500/20",
  cancelled: "bg-gray-600/20 text-gray-400 border-gray-500/20",
};

const prettifyStatus = (status) =>
  status
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Unknown";

const Invoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const presetCustomerId = searchParams.get("customerId") || "";
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [formError, setFormError] = useState("");

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      customerId: presetCustomerId || undefined,
      status: status === "all" ? undefined : status,
      search: search || undefined,
    }),
    [page, presetCustomerId, search, status],
  );

  const { data: invoicesData, isLoading, isFetching } = useGetInvoices(filters);
  const { data: summary } = useGetInvoiceSummary();
  const { data: aging } = useGetInvoiceAging();
  const { data: invoiceDetail, isLoading: invoiceLoading } =
    useGetInvoice(selectedInvoiceId);

  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const recordPaymentMutation = useRecordInvoicePayment();
  const cancelInvoiceMutation = useCancelInvoice();

  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  };

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerAPI.getCustomers(undefined, undefined, 1, 100);
        setCustomers(response.data || []);
      } catch (error) {
        console.error("Error loading customers", error);
      }
    };

    loadCustomers();
  }, []);



  const resetInvoiceForm = () => {
    setInvoiceForm(initialInvoiceForm);
    setEditingInvoice(null);
    setFormError("");
  };

  const openCreateModal = () => {
    resetInvoiceForm();
    setInvoiceForm((current) => ({
      ...current,
      customerId: presetCustomerId || "",
    }));
    setShowInvoiceModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      customerId: invoice.customer?._id || "",
      issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
      dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
      tax: String(invoice.tax || 0),
      discount: String(invoice.discount || 0),
      notes: invoice.notes || "",
      lineItems:
        invoice.lineItems?.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        })) || initialInvoiceForm.lineItems,
    });
    setFormError("");
    setShowInvoiceModal(true);
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoiceId(invoice._id);
    setPaymentForm({
      ...initialPaymentForm,
      amount: String(invoice.balanceDue || invoice.total || 0),
    });
    setShowPaymentModal(true);
  };

  const handleInvoiceLineChange = (index, field, value) => {
    setInvoiceForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addLineItem = () => {
    setInvoiceForm((current) => ({
      ...current,
      lineItems: [
        ...current.lineItems,
        { description: "", quantity: "1", unitPrice: "0" },
      ],
    }));
  };

  const removeLineItem = (index) => {
    setInvoiceForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length === 1
          ? current.lineItems
          : current.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const computedTotals = useMemo(() => {
    const subtotal = invoiceForm.lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      return sum + quantity * unitPrice;
    }, 0);
    const tax = Number(invoiceForm.tax || 0);
    const discount = Number(invoiceForm.discount || 0);
    return {
      subtotal,
      total: subtotal + tax - discount,
    };
  }, [invoiceForm]);

  const handleSaveInvoice = (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      customerId: invoiceForm.customerId,
      issueDate: invoiceForm.issueDate,
      dueDate: invoiceForm.dueDate,
      tax: Number(invoiceForm.tax || 0),
      discount: Number(invoiceForm.discount || 0),
      notes: invoiceForm.notes,
      lineItems: invoiceForm.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    const mutation = editingInvoice ? updateInvoiceMutation : createInvoiceMutation;
    const variables = editingInvoice
      ? { id: editingInvoice._id, payload }
      : payload;

    mutation.mutate(variables, {
      onSuccess: () => {
        setShowInvoiceModal(false);
        resetInvoiceForm();
      },
      onError: (error) => {
        setFormError(
          error.response?.data?.error || error.message || "Failed to save invoice",
        );
      },
    });
  };

  const handleRecordPayment = (event) => {
    event.preventDefault();

    recordPaymentMutation.mutate(
      {
        id: selectedInvoiceId,
        payload: {
          ...paymentForm,
          amount: Number(paymentForm.amount),
        },
      },
      {
        onSuccess: () => {
          setShowPaymentModal(false);
          setPaymentForm(initialPaymentForm);
          setFormError("");
        },
        onError: (error) => {
          setFormError(
            error.response?.data?.error ||
              error.message ||
              "Failed to record payment",
          );
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
              Invoice Control
            </h1>
            <p className="text-gray-500 text-sm mt-3 max-w-2xl">
              Create invoices, track partial collections, and stay ahead of overdue
              receivables without leaving the finance workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={presetCustomerId ? "secondary" : "outline"}
              onClick={() => setSearchParams({})}
              className="text-[10px]"
            >
              {presetCustomerId ? "Clear customer filter" : "All customers"}
            </Button>
            <Button onClick={openCreateModal} className="flex items-center gap-2 text-[10px]">
              <IoAddOutline size={18} />
              <span>New invoice</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SummaryCard
            title="Receivables"
            amount={summary?.totalReceivables || 0}
            icon={IoReceiptOutline}
            iconColor="text-blue-400"
            bgGradient="from-blue-500 to-blue-500"
          />
          <SummaryCard
            title="Overdue"
            amount={summary?.overdueReceivables || 0}
            icon={IoAlertCircleOutline}
            iconColor="text-red-400"
            bgGradient="from-red-500 to-red-600"
          />
          <SummaryCard
            title="Collected This Month"
            amount={summary?.collectedThisMonth || 0}
            icon={IoCashOutline}
            iconColor="text-emerald-400"
            bgGradient="from-blue-500 to-blue-500"
          />
          <SummaryCard
            title="Open Invoices"
            amount={summary?.openInvoiceCount || 0}
            format="number"
            icon={IoCheckmarkCircleOutline}
            iconColor="text-white"
            bgGradient="white"
            highlight
          />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
          <div className="2xl:col-span-2 space-y-6">
            <Card title="Invoice workspace" subtitle="Filter, review, and act on every invoice">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                  <Input
                    label="Search"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder="Invoice number or customer"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                    className="w-full px-4 py-3 bg-[#09090c] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="all" className="bg-[#09090c] text-white">All</option>
                    <option value="draft" className="bg-[#09090c] text-white">Draft</option>
                    <option value="sent" className="bg-[#09090c] text-white">Sent</option>
                    <option value="partially_paid" className="bg-[#09090c] text-white">Partially paid</option>
                    <option value="paid" className="bg-[#09090c] text-white">Paid</option>
                    <option value="overdue" className="bg-[#09090c] text-white">Overdue</option>
                    <option value="cancelled" className="bg-[#09090c] text-white">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Customer
                  </label>
                  <select
                    value={presetCustomerId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSearchParams(value ? { customerId: value } : {});
                      setPage(1);
                    }}
                    className="w-full px-4 py-3 bg-[#09090c] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-[#09090c] text-white">All customers</option>
                    {customers.map((customer) => (
                      <option
                        key={customer._id}
                        value={customer._id}
                        className="bg-[#09090c] text-white"
                      >
                        {customer.brandName
                          ? `${customer.name} (${customer.brandName})`
                          : customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-sm text-gray-400 py-10">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
                    No invoices match the current filters yet.
                  </div>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      className="rounded-2xl border border-white/5 bg-black/20 p-5"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-white">
                              {invoice.invoiceNumber}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusClasses[invoice.status]}`}
                            >
                              {prettifyStatus(invoice.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            {invoice.customer?.brandName
                              ? `${invoice.customer.name} (${invoice.customer.brandName})`
                              : invoice.customer?.name}
                          </p>
                          <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-400">
                            <span>Issued {formatDate(invoice.issueDate)}</span>
                            <span>Due {formatDate(invoice.dueDate)}</span>
                            <span>Total {formatCurrency(invoice.total)}</span>
                            <span>Balance {formatCurrency(invoice.balanceDue)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="text-[10px]"
                            onClick={() => setSelectedInvoiceId(invoice._id)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <IoEyeOutline size={16} />
                              View
                            </span>
                          </Button>
                          {invoice.status === "draft" && (
                            <>
                              <Button
                                variant="outline"
                                className="text-[10px]"
                                onClick={() => openEditModal(invoice)}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <IoCreateOutline size={16} />
                                  Edit
                                </span>
                              </Button>
                              <Button
                                className="text-[10px]"
                                onClick={() => sendInvoiceMutation.mutate(invoice._id)}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <IoSendOutline size={16} />
                                  Mark sent
                                </span>
                              </Button>
                            </>
                          )}
                          {["sent", "partially_paid", "overdue"].includes(
                            invoice.status,
                          ) && (
                            <Button
                              className="text-[10px]"
                              onClick={() => openPaymentModal(invoice)}
                            >
                              <span className="inline-flex items-center gap-2">
                                <IoCashOutline size={16} />
                                Record payment
                              </span>
                            </Button>
                          )}
                          {["draft", "sent"].includes(invoice.status) && (
                            <Button
                              variant="secondary"
                              className="text-[10px] text-red-300"
                              onClick={() => cancelInvoiceMutation.mutate(invoice._id)}
                            >
                              <span className="inline-flex items-center gap-2">
                                <IoTrashOutline size={16} />
                                Cancel
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <span>
                  Showing {invoices.length} of {pagination.totalItems} invoices
                  {isFetching ? "..." : ""}
                </span>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="text-[10px]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.totalPages || 1, current + 1),
                      )
                    }
                    disabled={page >= (pagination.totalPages || 1)}
                    className="text-[10px]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Aging buckets" subtitle="Where collections risk is accumulating">
              <div className="space-y-3">
                {[
                  ["Current", aging?.buckets?.current || 0],
                  ["1-30 days", aging?.buckets?.days1to30 || 0],
                  ["31-60 days", aging?.buckets?.days31to60 || 0],
                  ["61+ days", aging?.buckets?.days61plus || 0],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                  >
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Top overdue customers" subtitle="Focus collection outreach here first">
              <div className="space-y-3">
                {(summary?.topOverdueCustomers || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No overdue customers right now.</p>
                ) : (
                  summary.topOverdueCustomers.map((item) => (
                    <div
                      key={item.customerName}
                      className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-white">{item.customerName}</p>
                      <p className="text-xs text-red-300 mt-1">
                        {formatCurrency(item.balanceDue)} overdue
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          resetInvoiceForm();
        }}
        title={editingInvoice ? "Edit invoice" : "Create invoice"}
      >
        <form onSubmit={handleSaveInvoice} className="space-y-5">
          {formError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Customer
            </label>
            <select
              required
              value={invoiceForm.customerId}
              onChange={(event) =>
                setInvoiceForm((current) => ({
                  ...current,
                  customerId: event.target.value,
                }))
              }
              disabled={!!editingInvoice}
              className="w-full px-4 py-3 bg-[#09090c] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="" className="bg-[#09090c] text-white">Choose customer</option>
              {customers.map((customer) => (
                <option
                  key={customer._id}
                  value={customer._id}
                  className="bg-[#09090c] text-white"
                >
                  {customer.brandName
                    ? `${customer.name} (${customer.brandName})`
                    : customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue date"
              type="date"
              required
              value={invoiceForm.issueDate}
              onChange={(event) =>
                setInvoiceForm((current) => ({
                  ...current,
                  issueDate: event.target.value,
                }))
              }
            />
            <Input
              label="Due date"
              type="date"
              required
              value={invoiceForm.dueDate}
              onChange={(event) =>
                setInvoiceForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Line items</p>
              <Button variant="secondary" onClick={addLineItem} className="text-[10px]">
                Add line
              </Button>
            </div>
            {invoiceForm.lineItems.map((item, index) => (
              <div
                key={`${index}-${item.description}`}
                className="rounded-xl border border-white/5 p-4 bg-black/20 space-y-3"
              >
                <Input
                  label="Description"
                  required
                  value={item.description}
                  onChange={(event) =>
                    handleInvoiceLineChange(index, "description", event.target.value)
                  }
                  placeholder="Monthly retainer"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantity"
                    type="number"
                    required
                    value={item.quantity}
                    onChange={(event) =>
                      handleInvoiceLineChange(index, "quantity", event.target.value)
                    }
                  />
                  <Input
                    label="Unit price"
                    type="number"
                    required
                    value={item.unitPrice}
                    onChange={(event) =>
                      handleInvoiceLineChange(index, "unitPrice", event.target.value)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Line total{" "}
                    <span className="text-gray-300">
                      {formatCurrency(
                        Number(item.quantity || 0) * Number(item.unitPrice || 0),
                      )}
                    </span>
                  </p>
                  {invoiceForm.lineItems.length > 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => removeLineItem(index)}
                      className="text-[10px] text-red-300"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax"
              type="number"
              value={invoiceForm.tax}
              onChange={(event) =>
                setInvoiceForm((current) => ({ ...current, tax: event.target.value }))
              }
            />
            <Input
              label="Discount"
              type="number"
              value={invoiceForm.discount}
              onChange={(event) =>
                setInvoiceForm((current) => ({
                  ...current,
                  discount: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Notes</label>
            <textarea
              value={invoiceForm.notes}
              onChange={(event) =>
                setInvoiceForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={4}
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
              placeholder="Optional internal or customer-facing note"
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(computedTotals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Total</span>
              <span className="font-bold text-white">
                {formatCurrency(computedTotals.total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowInvoiceModal(false);
                resetInvoiceForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                createInvoiceMutation.isPending || updateInvoiceMutation.isPending
              }
            >
              {editingInvoice ? "Save changes" : "Create invoice"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentForm(initialPaymentForm);
          setFormError("");
        }}
        title="Record payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {formError}
            </div>
          )}
          <Input
            label="Amount"
            type="number"
            required
            value={paymentForm.amount}
            onChange={(event) =>
              setPaymentForm((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment date"
              type="date"
              required
              value={paymentForm.paymentDate}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  paymentDate: event.target.value,
                }))
              }
            />
            <Input
              label="Method"
              required
              value={paymentForm.method}
              onChange={(event) =>
                setPaymentForm((current) => ({ ...current, method: event.target.value }))
              }
            />
          </div>
          <Input
            label="Reference"
            value={paymentForm.reference}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
          />
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Notes</label>
            <textarea
              value={paymentForm.notes}
              onChange={(event) =>
                setPaymentForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={3}
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={recordPaymentMutation.isPending}
            >
              Save payment
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedInvoiceId && !showPaymentModal}
        onClose={() => setSelectedInvoiceId(null)}
        title="Invoice details"
      >
        {invoiceLoading || !invoiceDetail ? (
          <p className="text-sm text-gray-400">Loading invoice...</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {invoiceDetail.invoice.invoiceNumber}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {invoiceDetail.invoice.customer?.brandName
                      ? `${invoiceDetail.invoice.customer.name} (${invoiceDetail.invoice.customer.brandName})`
                      : invoiceDetail.invoice.customer?.name}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusClasses[invoiceDetail.invoice.status]}`}
                >
                  {prettifyStatus(invoiceDetail.invoice.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-400">
                <div>
                  <p>Issue date</p>
                  <p className="text-white mt-1">{formatDate(invoiceDetail.invoice.issueDate)}</p>
                </div>
                <div>
                  <p>Due date</p>
                  <p className="text-white mt-1">{formatDate(invoiceDetail.invoice.dueDate)}</p>
                </div>
                <div>
                  <p>Total</p>
                  <p className="text-white mt-1">{formatCurrency(invoiceDetail.invoice.total)}</p>
                </div>
                <div>
                  <p>Balance</p>
                  <p className="text-white mt-1">
                    {formatCurrency(invoiceDetail.invoice.balanceDue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Line items</p>
              {invoiceDetail.invoice.lineItems?.map((item, index) => (
                <div
                  key={`${item.description}-${index}`}
                  className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Payments</p>
                {["sent", "partially_paid", "overdue"].includes(
                  invoiceDetail.invoice.status,
                ) && (
                  <Button
                    className="text-[10px]"
                    onClick={() => {
                      setSelectedInvoiceId(invoiceDetail.invoice._id);
                      openPaymentModal(invoiceDetail.invoice);
                    }}
                  >
                    Record payment
                  </Button>
                )}
              </div>
              {invoiceDetail.payments?.length ? (
                invoiceDetail.payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.method} on {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {payment.reference || "No reference"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No payments recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Invoices;
