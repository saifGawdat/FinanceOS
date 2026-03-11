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
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 mb-8 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              Customers
            </h1>
            <p className="text-gray-400 mt-2">
              Monthly subscribers and payment tracking
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 w-full md:w-auto">
            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 bg-[#1a1d24] border border-white/10 rounded-xl text-gray-200 shadow-sm focus:outline-none focus:border-blue-500/50 transition-all flex-1 sm:flex-none appearance-none cursor-pointer"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1} className="bg-[#1a1d24]">
                  {m}
                </option>
              ))}
            </select>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-[#1a1d24] border border-white/10 rounded-xl text-gray-200 shadow-sm focus:outline-none focus:border-blue-500/50 transition-all flex-1 sm:flex-none appearance-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#1a1d24]">
                  {y}
                </option>
              ))}
            </select>

            <Button
              onClick={handleExport}
              variant="secondary"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <IoDownloadOutline size={20} />
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
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <IoAddOutline size={20} />
              <span>Add</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {customers.map((customer) => {
              const paid = customer.isPaid;
              return (
                <div
                  key={customer._id}
                  className={`bg-[#1a1d24] rounded-2xl shadow-lg border-l-4 p-6 transition-all border-white/6 hover:border-blue-500/30 ${
                    paid ? "border-l-blue-500" : "border-l-red-500"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-100">
                          {customer.name}
                        </h3>
                        {customer.brandName && (
                          <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-full text-xs font-medium border border-white/5">
                            {customer.brandName}
                          </span>
                        )}
                        {paid ? (
                          <span className="flex items-center gap-1 text-blue-400 text-sm font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <IoCheckmarkCircleOutline size={18} />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">
                            <IoCloseCircleOutline size={18} />
                            Unpaid
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Phone
                          </p>
                          <p className="font-semibold text-gray-300">
                            {customer.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1 font-medium">
                            Monthly
                          </p>
                          <p className="font-bold text-blue-400 text-lg">
                            £
                            {parseFloat(
                              customer.monthlyAmount,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-gray-500 mb-1 font-medium">
                            Total Spent
                          </p>
                          <p className="text-gray-400 font-medium italic">
                            Tracking...
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-gray-500 mb-1 font-medium">
                            Last Payment
                          </p>
                          <p className="text-gray-300">
                            {customer.lastPaidDate
                              ? new Date(
                                  customer.lastPaidDate,
                                ).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-gray-500 mb-1 font-medium">
                            Deadline
                          </p>
                          <p
                            className={`font-semibold ${
                              !paid &&
                              customer.paymentDeadline &&
                              new Date(customer.paymentDeadline) < new Date()
                                ? "text-red-400"
                                : "text-gray-300"
                            }`}
                          >
                            {customer.paymentDeadline
                              ? new Date(
                                  customer.paymentDeadline,
                                ).toLocaleDateString()
                              : "No Deadline"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!paid ? (
                        <Button
                          onClick={() => handlePay(customer._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 px-4 py-2"
                        >
                          <IoCashOutline size={20} />
                          <span>Pay</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUnpay(customer._id)}
                          variant="secondary"
                          className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/5 px-4 py-2"
                        >
                          <IoCloseCircleOutline size={20} />
                          <span>Undo</span>
                        </Button>
                      )}
                      <a
                        href={`https://wa.me/${customer.phoneNumber.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Message on WhatsApp"
                      >
                        <IoLogoWhatsapp size={20} />
                      </a>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Edit customer"
                      >
                        <IoPencilOutline size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Remove customer"
                      >
                        <IoTrashOutline size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <div className="bg-[#1a1d24] rounded-2xl p-12 text-center border-2 border-dashed border-white/5">
                <p className="text-gray-500 italic">
                  No customers found. Add your first customer to get started!
                </p>
              </div>
            )}

            {/* أدوات التحكم في الترقيم - Pagination Controls */}
            {!loading && customers.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2 p-4 rounded-2xl border border-white/6 shadow-lg">
                {/* معلومات الصفحة - Page Info */}
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Showing</span>{" "}
                  <span className="font-bold text-blue-400">
                    {customers.length}
                  </span>{" "}
                  <span className="font-medium">of</span>{" "}
                  <span className="font-bold text-blue-400">{totalItems}</span>{" "}
                  <span className="font-medium">customers</span>
                </div>

                {/* أزرار التنقل - Navigation Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || paginationLoading}
                    className="px-4 py-2 bg-white/3 border border-white/10 text-gray-300 rounded-xl font-medium transition-all hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold min-w-[120px] text-center">
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
                    className="px-4 py-2 bg-white/3 border border-white/10 text-gray-300 rounded-xl font-medium transition-all hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
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
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <Input
            label="Customer Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. John Doe"
          />
          <Input
            label="Brand/Company Name"
            value={formData.brandName}
            onChange={(e) =>
              setFormData({ ...formData, brandName: e.target.value })
            }
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Phone Number"
            required
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="e.g. +1234567890"
          />
          <Input
            label="Monthly Amount"
            required
            type="number"
            value={formData.monthlyAmount}
            onChange={(e) =>
              setFormData({ ...formData, monthlyAmount: e.target.value })
            }
            placeholder="e.g. 500"
          />
          <Input
            label="Payment Deadline"
            type="date"
            value={formData.paymentDeadline}
            onChange={(e) =>
              setFormData({ ...formData, paymentDeadline: e.target.value })
            }
          />
          <div className="flex gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? editingCustomer
                  ? "Saving..."
                  : "Creating..."
                : editingCustomer
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Customer Actions */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => {
          if (!isConfirming) {
            setConfirmModal({ open: false, type: null, customerId: null });
          }
        }}
        title={
          confirmModal.type === "pay"
            ? "Confirm Payment"
            : confirmModal.type === "unpay"
              ? "Undo Payment"
              : "Remove Customer"
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            {confirmModal.type === "pay" && (
              <>
                Confirm payment for this customer for the selected month (
                <span className="font-semibold text-blue-400">
                  {selectedMonth}/{selectedYear}
                </span>
                )?
              </>
            )}
            {confirmModal.type === "unpay" && (
              <>
                Are you sure you want to mark this customer as{" "}
                <span className="font-semibold text-red-400">UNPAID</span> for
                this month? This will remove the payment from income.
              </>
            )}
            {confirmModal.type === "delete" && (
              <>
                Are you sure you want to{" "}
                <span className="font-semibold text-red-400">
                  remove this customer
                </span>
                ? This will delete their subscription record for all months.
              </>
            )}
          </p>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setConfirmModal({ open: false, type: null, customerId: null })
              }
              className="px-4"
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmCustomerAction}
              className="px-4"
              disabled={isConfirming}
            >
              {isConfirming ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Customers;
