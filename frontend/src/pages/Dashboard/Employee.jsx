import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { IoBarChartOutline } from "react-icons/io5";

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

  const handleDeleteTransaction = (id) => {
    setDeleteTransactionId(id);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#1a1d24] p-6 rounded-xl border border-white/6 flex items-center justify-center flex-col shadow-lg">
            <p className="text-blue-400 text-sm font-medium">Total Employees</p>
            <p className="text-4xl font-bold text-gray-100 mt-2">
              {filteredEmployees.length}
            </p>
          </div>
          <div className="bg-[#1a1d24] p-6 rounded-xl border border-white/6 flex items-center justify-center flex-col shadow-lg border-l-4 border-l-blue-500">
            <p className="text-blue-400 text-sm font-medium">
              Total Net Salaries
            </p>
            <p className="text-4xl font-bold text-gray-100 mt-2">
              {formatCurrency(totalNetSalaries)}
            </p>
            <p className="text-xs text-blue-500/60 mt-1">
              Base: {formatCurrency(totalBaseSalaries)}
            </p>
          </div>
          <div className="bg-[#1a1d24] p-6 rounded-xl border border-white/6 flex items-center justify-center flex-col shadow-lg border-l-4 border-l-gray-300">
            <p className="text-gray-300 text-sm font-medium">
              Average Net Salary
            </p>
            <p className="text-4xl font-bold text-gray-100 mt-2">
              {formatCurrency(
                filteredEmployees.length > 0
                  ? totalNetSalaries / filteredEmployees.length
                  : 0,
              )}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search employees by name or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
          />
        </div>

        {/* Employee Table */}
        <div className="bg-[#1a1d24] rounded-xl overflow-hidden border border-white/6 shadow-lg">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No employees found. Click "Add Employee" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/6">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Base Salary
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Bonuses
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/0 divide-y divide-white/6">
                  {filteredEmployees.map((employee) => {
                    const stats = getEmployeeStats(employee);
                    return (
                      <tr
                        key={employee._id}
                        className="hover:bg-white/5 transition-colors border-0"
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-100">
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {employee.phoneNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {employee.jobTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined: {formatDate(employee.dateJoined)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-300">
                            {formatCurrency(employee.salary)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {stats.bonuses > 0
                              ? `+${stats.bonuses.toLocaleString()}`
                              : "-"}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            {stats.deductions > 0
                              ? `-${stats.deductions.toLocaleString()}`
                              : "-"}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded w-fit">
                            {formatCurrency(stats.netSalary)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(employee._id)}
                              className="text-red-400 hover:text-red-300 font-medium transition-colors"
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
        {!loading && employees.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2 p-4 rounded-xl border border-white/6 shadow-lg">
            {/* معلومات الصفحة - Page Information */}
            <div className="text-sm text-gray-400 text-center sm:text-left">
              <span className="font-medium">Showing</span>{" "}
              <span className="font-bold text-blue-400">
                {employees.length}
              </span>{" "}
              <span className="font-medium">of</span>{" "}
              <span className="font-bold text-blue-400">{totalItems}</span>{" "}
              <span className="font-medium">employees</span>
            </div>

            {/* أزرار التنقل - Navigation Buttons */}
            <div className="flex items-center gap-3">
              {/* زر الصفحة السابقة - Previous Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || paginationLoading}
                className="px-4 py-2 bg-white/3 border border-white/6 text-gray-300 rounded-xl font-medium transition-all hover:bg-white/6 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>←</span>
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* مؤشر الصفحة الحالية - Current Page Indicator */}
              <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold min-w-[120px] text-center">
                {paginationLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : (
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>

              {/* زر الصفحة التالية - Next Button */}
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1d24] border border-white/6 rounded-2xl p-6 md:p-8 max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-100">
                    Monthly Adjustments
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Manage bonuses and deductions for payroll
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-[#1a1d24] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                  >
                    {months.map((m, i) => (
                      <option
                        key={i + 1}
                        value={i + 1}
                        className="bg-[#1a1d24]"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-[#1a1d24] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y} className="bg-[#1a1d24]">
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAdjustmentsModal(false)}
                    className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <span className="text-2xl">&times;</span>
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
                    <tfoot className="bg-white/5 font-bold text-gray-200">
                      <tr>
                        <td className="px-4 py-3">Totals</td>
                        <td className="px-4 py-3 text-right">
                          £
                          {filteredEmployees
                            .reduce((sum, e) => sum + Number(e.salary || 0), 0)
                            .toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400">
                          £
                          {transactions
                            .filter((t) => t.type === "BONUS")
                            .reduce((s, t) => s + Number(t.amount || 0), 0)
                            .toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          £
                          {transactions
                            .filter((t) => t.type === "DEDUCTION")
                            .reduce((s, t) => s + Number(t.amount || 0), 0)
                            .toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          £
                          {filteredEmployees
                            .reduce(
                              (sum, e) =>
                                sum +
                                Number(getEmployeeStats(e).netSalary || 0),
                              0,
                            )
                            .toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Add Transaction Form & History */}
                <div className="flex flex-col gap-6 overflow-hidden ">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/6 shadow-xl">
                    <h3 className="font-bold text-gray-100 mb-5">
                      Add Adjustment
                    </h3>
                    <form onSubmit={handleAddTransaction}>
                      {adjustmentsError && (
                        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                          {adjustmentsError}
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                          Employee
                        </label>
                        <select
                          className="w-full bg-[#1a1d24] border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                          value={adjustmentFormData.employeeId}
                          onChange={(e) =>
                            setAdjustmentFormData({
                              ...adjustmentFormData,
                              employeeId: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="" className="bg-[#1a1d24]">
                            Select Employee
                          </option>
                          {filteredEmployees.map((emp) => (
                            <option
                              key={emp._id}
                              value={emp._id}
                              className="bg-[#1a1d24]"
                            >
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                            Type
                          </label>
                          <select
                            className="w-full bg-[#1a1d24] border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                            value={adjustmentFormData.type}
                            onChange={(e) =>
                              setAdjustmentFormData({
                                ...adjustmentFormData,
                                type: e.target.value,
                              })
                            }
                          >
                            <option value="BONUS" className="bg-[#1a1d24]">
                              Bonus (+)
                            </option>
                            <option value="DEDUCTION" className="bg-[#1a1d24]">
                              Deduction (-)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            className="w-full bg-white/3 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                            value={adjustmentFormData.amount}
                            onChange={(e) =>
                              setAdjustmentFormData({
                                ...adjustmentFormData,
                                amount: e.target.value,
                              })
                            }
                            required
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                          Description
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/3 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                          value={adjustmentFormData.description}
                          onChange={(e) =>
                            setAdjustmentFormData({
                              ...adjustmentFormData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Reason (optional)"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                        disabled={isAddingTransaction}
                      >
                        {isAddingTransaction ? "Adding..." : "Add Adjustment"}
                      </button>
                    </form>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white/2 border border-white/6 rounded-2xl shadow-inner scrollbar-hide">
                    <div className="p-4 bg-white/5 border-b border-white/6 font-bold text-sm text-gray-300">
                      Recent Adjustments ({selectedMonth}/{selectedYear})
                    </div>
                    {transactions.length === 0 ? (
                      <p className="p-8 text-center text-gray-500 text-sm italic">
                        No adjustments for this month.
                      </p>
                    ) : (
                      <ul className="divide-y divide-white/6">
                        {transactions.map((t) => (
                          <li
                            key={t._id}
                            className="p-4 hover:bg-white/5 flex justify-between items-center group transition-colors"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-200">
                                {t.employee?.name || "Unknown Employee"}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {t.type === "BONUS" ? "Bonus" : "Deduction"}
                                {t.description && ` • ${t.description}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-sm font-bold ${
                                  t.type === "BONUS"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {t.type === "BONUS" ? "+" : "-"}£
                                {t.amount.toLocaleString()}
                              </div>
                              <button
                                onClick={() => handleDeleteTransaction(t._id)}
                                className="text-xs text-red-500/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-medium mt-1"
                              >
                                Remove
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
        title="Delete Employee"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to{" "}
            <span className="font-semibold text-red-400">delete</span> this
            employee and their salary data? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteEmployeeId(null)}
              className="px-4"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteEmployee}
              className="px-4"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
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
        title="Delete Adjustment"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to{" "}
            <span className="font-semibold text-red-400">
              remove this salary adjustment
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTransactionId(null)}
              className="px-4"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteTransaction}
              className="px-4"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Employee;
