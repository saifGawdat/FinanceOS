import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { IoBarChartOutline, IoCloseOutline } from "react-icons/io5";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import * as XLSX from "xlsx";
import { IoDownloadOutline } from "react-icons/io5";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addTransaction,
  getTransactionsByMonth,
  deleteTransaction,
} from "../../api/employee";
import { formatCurrency } from "../../utils/formatters";

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    salary: "",
    jobTitle: "",
    phoneNumber: "",
    dateJoined: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // حالة الترقيم (Pagination State)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1); // الصفحة الحالية
  const [totalPages, setTotalPages] = useState(1); // إجمالي عدد الصفحات
  const [totalItems, setTotalItems] = useState(0); // إجمالي عدد الموظفين
  const [itemsPerPage] = useState(10); // عدد الموظفين في الصفحة
  const [paginationLoading, setPaginationLoading] = useState(false); // حالة التحميل أثناء تغيير الصفحة

  // دالة جلب الموظفين مع دعم الترقيم (مع useCallback لتجنب إعادة الإنشاء)
  // Function to fetch employees with pagination (with useCallback to avoid recreation)
  const fetchEmployees = useCallback(async () => {
    try {
      // إظهار مؤشر التحميل المناسب
      // Show appropriate loading indicator
      if (currentPage === 1) {
        setLoading(true); // تحميل كامل للصفحة الأولى
      } else {
        setPaginationLoading(true); // تحميل خفيف لتغيير الصفحة
      }

      // جلب البيانات من الـ API
      // Fetch data from API
      const response = await getEmployees(currentPage, itemsPerPage);

      // تحديث الحالة بالبيانات والمعلومات الوصفية
      // Update state with data and metadata
      setEmployees(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // جلب الموظفين عند تحميل الصفحة أو تغيير رقم الصفحة
  // Fetch employees on mount or page change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // إعادة الجلب عند تغيير الصفحة

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee._id, formData);
      } else {
        await createEmployee(formData);
      }
      setShowModal(false);
      setFormData({
        name: "",
        salary: "",
        jobTitle: "",
        phoneNumber: "",
        dateJoined: new Date().toISOString().split("T")[0],
      });
      setEditingEmployee(null);
      // العودة إلى الصفحة الأولى بعد إضافة/تعديل موظف
      // Return to first page after adding/editing employee
      setCurrentPage(1);
      await fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      setError(error.response?.data?.message || "Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      salary: employee.salary,
      jobTitle: employee.jobTitle,
      phoneNumber: employee.phoneNumber || "",
      dateJoined: employee.dateJoined
        ? new Date(employee.dateJoined).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteEmployeeId(id);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      salary: "",
      jobTitle: "",
      phoneNumber: "",
      dateJoined: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [adjustmentFormData, setAdjustmentFormData] = useState({
    employeeId: "",
    type: "BONUS",
    amount: "",
    description: "",
  });

  const [adjustmentsError, setAdjustmentsError] = useState("");
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

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await getTransactionsByMonth(selectedMonth, selectedYear);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [selectedMonth, selectedYear]);

  // Fetch transactions on mount and when month/year changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (isAddingTransaction) return;
    setIsAddingTransaction(true);
    try {
      await addTransaction({
        ...adjustmentFormData,
        month: selectedMonth,
        year: selectedYear,
      });
      setAdjustmentFormData({
        ...adjustmentFormData,
        amount: "",
        description: "",
      });
      setAdjustmentsError("");
      await fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      setAdjustmentsError("Failed to add transaction. Please try again.");
    } finally {
      setIsAddingTransaction(false);
    }
  };



  const confirmDeleteEmployee = async () => {
    if (!deleteEmployeeId) return;
    try {
      setIsDeleting(true);
      await deleteEmployee(deleteEmployeeId);
      setDeleteEmployeeId(null);
      setCurrentPage(1);
      await fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deleteTransactionId);
      setDeleteTransactionId(null);
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getEmployeeStats = (employee) => {
    const employeeTransactions = transactions.filter(
      (t) => t.employee && t.employee._id === employee._id,
    );
    const bonuses = employeeTransactions
      .filter((t) => t.type === "BONUS")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const deductions = employeeTransactions
      .filter((t) => t.type === "DEDUCTION")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const netSalary = Number(employee.salary || 0) + bonuses - deductions;
    return { bonuses, deductions, netSalary };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.isActive &&
      (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalBaseSalaries = filteredEmployees.reduce(
    (sum, emp) => sum + emp.salary,
    0,
  );

  const totalNetSalaries = filteredEmployees.reduce(
    (sum, emp) => sum + getEmployeeStats(emp).netSalary,
    0,
  );

  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map((emp) => {
      const stats = getEmployeeStats(emp);
      return {
        "Employee Name": emp.name,
        "Job Title": emp.jobTitle,
        "Base Salary": emp.salary,
        Bonuses: stats.bonuses,
        Deductions: stats.deductions,
        "Net Salary": stats.netSalary,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salaries");

    // Auto-width columns
    const max_width = dataToExport.reduce(
      (w, r) => Math.max(w, r["Employee Name"].length),
      10,
    );
    worksheet["!cols"] = [{ wch: max_width }];

    XLSX.writeFile(
      workbook,
      `Salaries for ${months[selectedMonth - 1]} ${selectedYear}.xlsx`,
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-6 text-center md:text-left">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              Employee Management
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your employees and their salaries for{" "}
              <span className="font-semibold text-blue-400">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <IoDownloadOutline size={20} />
              Export to Excel
            </Button>
            <Button
              onClick={() => setShowAdjustmentsModal(true)}
              variant="secondary"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>
                <IoBarChartOutline size={20} />
              </span>{" "}
              Monthly Adjustments
            </Button>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              + Add Employee
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0e0e12] p-6 rounded-2xl border border-white/5 flex items-center justify-center flex-col shadow-2xl shadow-black/60 group hover:border-white/10 transition-all duration-300">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Total Employees</p>
            <p className="text-4xl font-black text-white">
              {filteredEmployees.length}
            </p>
          </div>
          <div className="bg-[#0e0e12] p-6 rounded-2xl border border-white/5 flex items-center justify-center flex-col shadow-2xl shadow-black/60 border-l-4 border-l-blue-600 group hover:border-white/10 transition-all duration-300">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">
              Total Net Salaries
            </p>
            <p className="text-4xl font-black text-white">
              {formatCurrency(totalNetSalaries)}
            </p>
            <p className="text-[10px] text-blue-500/60 mt-1 font-bold">
              Base: {formatCurrency(totalBaseSalaries)}
            </p>
          </div>
          <div className="bg-[#0e0e12] p-6 rounded-2xl border border-white/5 flex items-center justify-center flex-col shadow-2xl shadow-black/60 border-l-4 border-l-gray-600 group hover:border-white/10 transition-all duration-300">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
              Average Net Salary
            </p>
            <p className="text-4xl font-black text-white">
              {formatCurrency(
                filteredEmployees.length > 0
                  ? totalNetSalaries / filteredEmployees.length
                  : 0,
              )}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 group">
          <label htmlFor="employee-search" className="sr-only">Search employees</label>
          <input
            id="employee-search"
            type="text"
            placeholder="Search employees by name or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-[#0e0e12] rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/80">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
              Syncing Employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">
              No results found in your roster.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/2">
                  <tr>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Name & Contact
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Role & Tenure
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Base Salary
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                      Bonuses
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">
                      Deductions
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                      Net Payout
                    </th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Control
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEmployees.map((employee) => {
                    const stats = getEmployeeStats(employee);
                    return (
                      <tr
                        key={employee._id}
                        className="hover:bg-white/3 transition-all duration-300"
                      >
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-white tracking-tight">
                            {employee.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {employee.phoneNumber || "No Phone"}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-400">
                            {employee.jobTitle}
                          </div>
                          <div className="text-[10px] text-gray-600 font-medium">
                            Ext {formatDate(employee.dateJoined)}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-400">
                            {formatCurrency(employee.salary)}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-blue-500">
                            {stats.bonuses > 0
                              ? `+${stats.bonuses.toLocaleString()}`
                              : "—"}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-red-500">
                            {stats.deductions > 0
                              ? `-${stats.deductions.toLocaleString()}`
                              : "—"}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-white bg-white/5 border border-white/5 px-3 py-1 rounded-lg w-fit shadow-inner">
                            {formatCurrency(stats.netSalary)}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap text-sm">
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(employee._id)}
                              className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* أدوات التحكم في الترقيم (Pagination Controls) */}
        {/* Pagination Controls */}
        {!loading && employees.filter((employee) => employee.isActive).length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2 p-5 rounded-2xl border border-white/5 shadow-2xl shadow-black/80">
            {/* معلومات الصفحة - Page Information */}
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest text-center sm:text-left">
              <span>Showing</span>{" "}
              <span className="text-blue-500 mx-1">
                {employees.filter((employee) => employee.isActive).length}
              </span>{" "}
              <span>of</span>{" "}
              <span className="text-blue-500 mx-1">{totalItems}</span>{" "}
              <span>personnel</span>
            </div>

            {/* أزرار التنقل - Navigation Buttons */}
            <div className="flex items-center gap-3">
              {/* زر الصفحة السابقة - Previous Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || paginationLoading}
                className="px-5 py-2.5 bg-white/3 border border-white/5 text-gray-400 rounded-xl font-bold transition-all hover:bg-white/6 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>←</span>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* مؤشر الصفحة الحالية - Current Page Indicator */}
              <div className="px-5 py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl font-black min-w-[130px] text-center shadow-inner">
                {paginationLoading ? (
                  <span className="text-[10px]">SYNCING...</span>
                ) : (
                  <span className="text-xs">
                    {currentPage} / {totalPages}
                  </span>
                )}
              </div>

              {/* زر الصفحة التالية - Next Button */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages || paginationLoading}
                className="px-5 py-2.5 bg-white/3 border border-white/5 text-gray-400 rounded-xl font-bold transition-all hover:bg-white/6 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="hidden sm:inline">Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
            setFormData({
              name: "",
              salary: "",
              jobTitle: "",
              phoneNumber: "",
              dateJoined: new Date().toISOString().split("T")[0],
            });
          }}
          title={editingEmployee ? "Edit Employee" : "Add New Employee"}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Job Title"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                required
              />
              <Input
                label="Monthly Salary (£)"
                type="number"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
                required
                min="0"
                step="0.01"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phoneNumber: e.target.value,
                  })
                }
                placeholder="(123) 456-7890"
              />
              <div className="md:col-span-2">
                <Input
                  label="Date Joined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateJoined: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingEmployee
                    ? "Update Employee"
                    : "Create Employee"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingEmployee(null);
                  setFormData({
                    name: "",
                    salary: "",
                    jobTitle: "",
                    phoneNumber: "",
                    dateJoined: new Date().toISOString().split("T")[0],
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Adjustments Modal */}
        {showAdjustmentsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-400">
            <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6 md:p-8 max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Monthly Adjustments
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Manage bonuses and deductions for payroll
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-transparent rounded-lg px-4 py-2 text-xs font-black text-gray-300 uppercase focus:outline-none focus:bg-white/5 cursor-pointer appearance-none transition-all"
                    >
                      {months.map((m, i) => (
                        <option
                          key={i + 1}
                          value={i + 1}
                          className="bg-[#09090c] text-white"
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="bg-transparent rounded-lg px-4 py-2 text-xs font-black text-gray-300 uppercase focus:outline-none focus:bg-white/5 cursor-pointer appearance-none transition-all"
                    >
                      {[2024, 2025, 2026].map((y) => (
                        <option key={y} value={y} className="bg-[#09090c] text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowAdjustmentsModal(false)}
                    className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <IoCloseOutline size={28} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Employee List & Net Salary Table */}
                <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar">
                  <table className="min-w-full divide-y divide-white/6 border border-white/6 rounded-xl overflow-hidden">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase">
                          Base Salary
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-400 uppercase">
                          Bonuses
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-red-400 uppercase">
                          Deductions
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-200 uppercase">
                          Net Salary
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/0 divide-y divide-white/6">
                      {filteredEmployees.map((emp) => {
                        const stats = getEmployeeStats(emp);
                        return (
                          <tr
                            key={emp._id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-300">
                              {emp.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-400">
                              {formatCurrency(emp.salary)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-blue-400">
                              {stats.bonuses > 0
                                ? `+${stats.bonuses.toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-red-400">
                              {stats.deductions > 0
                                ? `-${stats.deductions.toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-300">
                              £{stats.netSalary.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-white/[0.03] font-black text-white backdrop-blur-md">
                      <tr>
                        <td className="px-5 py-5 text-[10px] uppercase tracking-widest">Global Totals</td>
                        <td className="px-5 py-5 text-right font-bold text-gray-500">
                          {formatCurrency(filteredEmployees.reduce((sum, e) => sum + Number(e.salary || 0), 0))}
                        </td>
                        <td className="px-5 py-5 text-right font-black text-blue-500">
                          {formatCurrency(transactions.filter((t) => t.type === "BONUS").reduce((s, t) => s + Number(t.amount || 0), 0))}
                        </td>
                        <td className="px-5 py-5 text-right font-black text-red-500">
                          {formatCurrency(transactions.filter((t) => t.type === "DEDUCTION").reduce((s, t) => s + Number(t.amount || 0), 0))}
                        </td>
                        <td className="px-5 py-5 text-right font-black text-white">
                          {formatCurrency(totalNetSalaries)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                  <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">
                      New Adjustment
                    </h3>
                    {adjustmentsError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400">
                        {adjustmentsError}
                      </div>
                    )}
                    <form onSubmit={handleAddTransaction} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                          Personnel
                        </label>
                        <select
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 transition-all appearance-none shadow-inner"
                          value={adjustmentFormData.employeeId}
                          onChange={(e) =>
                            setAdjustmentFormData({
                              ...adjustmentFormData,
                              employeeId: e.target.value,
                            })
                          }
                          required
                        >
                          {employees.filter((employee) => employee.isActive).length === 0 && (
                            <option value="" className="bg-[#09090c]">No Active Employees</option>
                          )}
                          {employees.filter((employee) => employee.isActive).map((emp) => (
                            <option
                              key={emp._id}
                              value={emp._id}
                              className="bg-[#09090c]"
                            >
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setAdjustmentFormData({ ...adjustmentFormData, type: "BONUS" })}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            adjustmentFormData.type === "BONUS"
                              ? "bg-blue-600 text-white shadow-lg"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          Bonus
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustmentFormData({ ...adjustmentFormData, type: "DEDUCTION" })}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            adjustmentFormData.type === "DEDUCTION"
                              ? "bg-red-600 text-white shadow-lg"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          Deduction
                        </button>
                      </div>

                      <Input
                        label="Amount (£)"
                        type="number"
                        value={adjustmentFormData.amount}
                        onChange={(e) =>
                          setAdjustmentFormData({
                            ...adjustmentFormData,
                            amount: e.target.value,
                          })
                        }
                        required
                        min="0"
                        step="0.01"
                      />

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                          Authorization Reason
                        </label>
                        <textarea
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 transition-all min-h-[100px] shadow-inner"
                          value={adjustmentFormData.description}
                          onChange={(e) =>
                            setAdjustmentFormData({
                              ...adjustmentFormData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Purpose of adjustment..."
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full py-4 font-black uppercase tracking-widest"
                        disabled={isAddingTransaction}
                      >
                        {isAddingTransaction ? "SYNCING..." : "COMMIT ADJUSTMENT"}
                      </Button>
                    </form>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-black/20 border border-white/5 rounded-2xl shadow-inner scrollbar-hide">
                    <div className="p-4 bg-white/3 border-b border-white/5 font-black text-[10px] text-gray-500 uppercase tracking-widest sticky top-0 backdrop-blur-md">
                      Recent Ledger Entries
                    </div>
                    {transactions.length === 0 ? (
                      <p className="p-12 text-center text-gray-600 text-xs italic">
                        No active adjustments in this period.
                      </p>
                    ) : (
                      <ul className="divide-y divide-white/5">
                        {transactions.map((t) => (
                          <li
                            key={t._id}
                            className="p-5 hover:bg-white/2 flex justify-between items-center group transition-all duration-300"
                          >
                            <div>
                              <div className="text-sm font-bold text-white tracking-tight">
                                {t.employee?.name || "System Record"}
                              </div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                {t.type} {t.description && `• ${t.description}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-sm font-black ${
                                  t.type === "BONUS"
                                    ? "text-blue-500"
                                    : "text-red-500"
                                }`}
                              >
                                {t.type === "BONUS" ? "+" : "-"}
                                {formatCurrency(t.amount)}
                              </div>
                              <button
                                onClick={() => confirmDeleteTransaction(t._id)}
                                className="text-[10px] text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-black uppercase tracking-widest mt-1"
                              >
                                Purge
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Delete Employee Confirmation Modal */}
      <Modal
        isOpen={!!deleteEmployeeId}
        onClose={() => {
          if (!isDeleting) setDeleteEmployeeId(null);
        }}
        title="Terminate Employee Record"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Are you sure you want to <span className="font-black text-red-500 uppercase tracking-widest">purge</span> this
            personnel record? All associated salary and adjustment data will be permanently deleted from the ledger.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteEmployeeId(null)}
              className="px-6 font-bold"
              disabled={isDeleting}
            >
              Abeyance
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteEmployee}
              className="px-6 font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
              disabled={isDeleting}
            >
              {isDeleting ? "PURGING..." : "CONFIRM PURGE"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Adjustment Confirmation Modal */}
      <Modal
        isOpen={!!deleteTransactionId}
        onClose={() => {
          if (!isDeleting) setDeleteTransactionId(null);
        }}
        title="Void Ledger Entry"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Are you sure you want to <span className="font-black text-red-500 uppercase tracking-widest">void</span> this
            salary adjustment? This will recalculate the net payout for this period immediately.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTransactionId(null)}
              className="px-6 font-bold"
              disabled={isDeleting}
            >
              Abeyance
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteTransaction}
              className="px-6 font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
              disabled={isDeleting}
            >
              {isDeleting ? "VOIDING..." : "CONFIRM VOID"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Employee;
