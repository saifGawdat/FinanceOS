import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { customerAPI } from "../../api/customer";
import {
  IoAddOutline,
  IoTrashOutline,
  IoCashOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDownloadOutline,
  IoPencilOutline,
  IoLogoWhatsapp,
} from "react-icons/io5";
import * as XLSX from "xlsx";
import { formatCurrency } from "../../utils/formatters";


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // حالات الترقيم - Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [paginationLoading, setPaginationLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    phoneNumber: "",
    monthlyAmount: "",
    paymentDeadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // "pay" | "unpay" | "delete"
    customerId: null,
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchCustomers = React.useCallback(async () => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setPaginationLoading(true);
      }
      const response = await customerAPI.getCustomers(
        selectedMonth,
        selectedYear,
        currentPage,
        itemsPerPage,
      );
      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [selectedMonth, selectedYear, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handlePay = async (id) => {
    setConfirmModal({
      open: true,
      type: "pay",
      customerId: id,
    });
  };

  const handleUnpay = async (id) => {
    setConfirmModal({
      open: true,
      type: "unpay",
      customerId: id,
    });
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      open: true,
      type: "delete",
      customerId: id,
    });
  };

  const confirmCustomerAction = async () => {
    const { type, customerId } = confirmModal;
    if (!type || !customerId) return;

    try {
      setIsConfirming(true);
      if (type === "pay") {
        await customerAPI.pay(customerId, selectedMonth, selectedYear);
      } else if (type === "unpay") {
        await customerAPI.unpay(customerId, selectedMonth, selectedYear);
      } else if (type === "delete") {
        await customerAPI.delete(customerId);
      }
      setConfirmModal({ open: false, type: null, customerId: null });
      await fetchCustomers();
    } catch (error) {
      console.error("Error performing customer action:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      brandName: customer.brandName || "",
      phoneNumber: customer.phoneNumber,
      monthlyAmount: customer.monthlyAmount,
      paymentDeadline: customer.paymentDeadline
        ? new Date(customer.paymentDeadline).toISOString().split("T")[0]
        : "",
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const submissionData = {
      ...formData,
      name: formData.name.trim(),
      brandName: formData.brandName?.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      monthlyAmount: parseFloat(formData.monthlyAmount),
    };

    try {
      if (editingCustomer) {
        await customerAPI.update(editingCustomer._id, submissionData);
      } else {
        await customerAPI.create(submissionData);
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      setError("");
      setFormData({
        name: "",
        brandName: "",
        phoneNumber: "",
        monthlyAmount: "",
        paymentDeadline: "",
      });
      await fetchCustomers();
      setCurrentPage(1); // العودة للصفحة الأولى بعد الإضافة أو التعديل
    } catch (error) {
      console.error("Error saving customer:", error);
      setError(
        error.response?.data?.error || error.message || "Error saving customer",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const dataToExport = customers.map((c) => ({
      "Customer Name": c.name,
      "Brand Name": c.brandName || "N/A",
      "Phone Number": c.phoneNumber,
      "Monthly Amount": c.monthlyAmount,
      "payment Deadline": c.paymentDeadline,
      Status: c.isPaid ? "Paid" : "Unpaid",
      Month: selectedMonth,
      Year: selectedYear,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `Customers_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
              Subscriber <span className="text-gray-500">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-[0.2em]">
              Monthly recurring revenue and collection lifecycle
            </p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-[#09090c] p-1 rounded-xl border border-white/5 shadow-2xl">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none cursor-pointer border-r border-white/5"
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-[#09090c]">
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-[#09090c]">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleExport}
              variant="secondary"
              className="flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-widest"
            >
              <IoDownloadOutline size={16} />
              <span>Export</span>
            </Button>
            <Button
              onClick={() => {
                setEditingCustomer(null);
                setFormData({
                  name: "",
                  brandName: "",
                  phoneNumber: "",
                  monthlyAmount: "",
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
            >
              <IoAddOutline size={20} />
              <span>Provision</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-[#0e0e12] rounded-2xl border border-white/5">
            <div className="w-12 h-12 border-2 border-white/5 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Synchronizing Customer Core...
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {customers.map((customer) => {
              const paid = customer.isPaid;
              return (
                <div
                  key={customer._id}
                  className={`bg-[#0e0e12] rounded-2xl shadow-2xl border border-white/5 p-8 transition-all group overflow-hidden relative ${
                    paid ? "hover:border-blue-500/30" : "hover:border-red-500/30"
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${paid ? "bg-blue-500" : "bg-red-500"}`} />
                  
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                          {customer.name}
                        </h3>
                        {customer.brandName && (
                          <span className="bg-[#09090c] text-gray-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/5">
                            {customer.brandName}
                          </span>
                        )}
                        <div
                          className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm ${
                            paid
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                              : "bg-red-500/10 border-red-500/20 text-red-500"
                          }`}
                        >
                          {paid ? (
                            <>
                              <IoCheckmarkCircleOutline size={12} />
                              Cleared
                            </>
                          ) : (
                            <>
                              <IoCloseCircleOutline size={12} />
                              Pending
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Identification</p>
                          <p className="text-xs font-bold text-gray-300">{customer.phoneNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Yield</p>
                          <p className="text-lg font-black text-blue-500">
                            {formatCurrency(parseFloat(customer.monthlyAmount))}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Last Activity</p>
                          <p className="text-xs font-bold text-gray-300">
                            {customer.lastPaidDate
                              ? new Date(customer.lastPaidDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "No Record"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">SLA Deadline</p>
                          <p
                            className={`text-xs font-black ${
                              !paid &&
                              customer.paymentDeadline &&
                              new Date(customer.paymentDeadline) < new Date()
                                ? "text-red-500"
                                : "text-gray-300"
                            }`}
                          >
                            {customer.paymentDeadline
                              ? new Date(customer.paymentDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Unrestricted"}
                          </p>
                        </div>
                        <div className="space-y-1 hidden lg:block">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">LTV Analysis</p>
                          <p className="text-xs font-bold text-gray-500 italic">Processing...</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto border-t xl:border-t-0 border-white/5 pt-6 xl:pt-0">
                      {!paid ? (
                        <Button
                          onClick={() => handlePay(customer._id)}
                          className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3 px-8 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                        >
                          <IoCashOutline size={18} />
                          <span>Clear Due</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUnpay(customer._id)}
                          variant="secondary"
                          className="flex-1 xl:flex-none text-red-500 hover:bg-red-500/10 border-red-500/20 flex items-center justify-center gap-3 px-8 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                        >
                          <IoCloseCircleOutline size={18} />
                          <span>Revert</span>
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${customer.phoneNumber.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-gray-500 hover:text-emerald-500 bg-[#09090c] border border-white/5 rounded-xl transition-all group-hover:border-white/10"
                          title="WhatsApp Dispatch"
                        >
                          <IoLogoWhatsapp size={18} />
                        </a>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-3 text-gray-500 hover:text-blue-500 bg-[#09090c] border border-white/5 rounded-xl transition-all group-hover:border-white/10"
                          title="Modify Entry"
                        >
                          <IoPencilOutline size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="p-3 text-gray-500 hover:text-red-500 bg-[#09090c] border border-white/5 rounded-xl transition-all group-hover:border-white/10"
                          title="Terminate Record"
                        >
                          <IoTrashOutline size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <div className="bg-[#0e0e12] rounded-2xl p-24 text-center border-2 border-dashed border-white/5">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
                  Registry is currently void of active subscribers.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && customers.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0e0e12] p-6 rounded-2xl border border-white/5 shadow-2xl">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Index <span className="text-blue-500">{customers.length}</span> / <span className="text-blue-500">{totalItems}</span> Entities
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || paginationLoading}
                    className="p-3 bg-[#09090c] border border-white/5 text-gray-400 rounded-xl font-black transition-all hover:text-white disabled:opacity-20 flex items-center justify-center min-w-[50px] group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  </button>

                  <div className="px-6 py-2.5 bg-blue-500/5 border border-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest min-w-[150px] text-center shadow-inner">
                    {paginationLoading ? "QUERYING..." : `Sector ${currentPage} OF ${totalPages}`}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || paginationLoading}
                    className="p-3 bg-[#09090c] border border-white/5 text-gray-400 rounded-xl font-black transition-all hover:text-white disabled:opacity-20 flex items-center justify-center min-w-[50px] group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms & Modals */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCustomer(null);
          setError("");
          setFormData({
            name: "",
            brandName: "",
            phoneNumber: "",
            monthlyAmount: "",
            paymentDeadline: "",
          });
        }}
        title={editingCustomer ? "Calibrate Subscriber" : "Provision New Entity"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Legal Identity"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full Entity Name"
            />
            <Input
              label="Trade Marker"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="Commercial Brand"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Communication Line"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+00 000 000 000"
            />
            <Input
              label="Monthly Commitment"
              required
              type="number"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <Input
            label="SLA Deadline"
            type="date"
            value={formData.paymentDeadline}
            onChange={(e) => setFormData({ ...formData, paymentDeadline: e.target.value })}
          />
          <div className="flex gap-4 pt-6">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest"
            >
              Abort
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20">
              {isSubmitting ? "PROCESSING..." : editingCustomer ? "SYNC CHANGES" : "PROVISION"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => {
          if (!isConfirming) {
            setConfirmModal({ open: false, type: null, customerId: null });
          }
        }}
        title="Override Confirmation"
      >
        <div className="space-y-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-relaxed">
            {confirmModal.type === "pay" && (
              <>
                Confirm capital injection for the period{" "}
                <span className="text-blue-500 font-black">
                  {selectedMonth}/{selectedYear}
                </span>{" "}
                from this entity?
              </>
            )}
            {confirmModal.type === "unpay" && (
              <>
                Confirm ledger reversal? This will treat the current period as{" "}
                <span className="text-red-500 font-black">UNSETTLED</span>.
              </>
            )}
            {confirmModal.type === "delete" && (
              <>
                Initiate record termination? This action is{" "}
                <span className="text-red-500 font-black">IRREVERSIBLE</span> and will purge historical subscription data.
              </>
            )}
          </p>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: null, customerId: null })}
              className="px-8 py-3 font-black uppercase text-[10px] tracking-widest"
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmCustomerAction}
              className={`px-8 py-3 font-black uppercase text-[10px] tracking-widest shadow-lg ${
                confirmModal.type === "delete" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "shadow-blue-500/20"
              }`}
              disabled={isConfirming}
            >
              {isConfirming ? "QUERYING..." : "CONFIRM"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Customers;
