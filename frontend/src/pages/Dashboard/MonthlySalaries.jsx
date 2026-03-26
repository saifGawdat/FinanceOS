import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import MonthYearSelector from "../../components/ui/MonthYearSelector";
import { getActiveEmployees } from "../../api/employee";

const MonthlySalaries = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getActiveEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthYearChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const totalSalaries = employees.reduce(
    (sum, emp) => sum + Number(emp.salary || 0),
    0,
  );

  const getMonthName = (monthNum) => {
    return new Date(2000, monthNum - 1).toLocaleDateString("en-US", {
      month: "long",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Payroll <span className="text-gray-500">Intelligence</span>
          </h1>
          <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-[0.2em]">
            Consolidated distribution metrics for {getMonthName(month)} {year}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl mb-8 text-xs font-black uppercase tracking-widest animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Month/Year Selector */}
          <div className="lg:col-span-1 bg-[#09090c] p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-center">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">
              Select Period
            </label>
            <MonthYearSelector
              onSelect={handleMonthYearChange}
              initialMonth={month}
              initialYear={year}
            />
          </div>

          {/* Total Salaries Card */}
          <div className="lg:col-span-3 bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center md:items-start justify-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-[120px] pointer-events-none"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] relative z-10 mb-2">
              Gross Monthly Disbursement
            </p>
            <div className="flex items-baseline gap-4 relative z-10">
              <p className="text-6xl font-black text-white tracking-tighter">
                £{totalSalaries.toLocaleString()}
              </p>
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest">
                {employees.length} Active Personnel
              </div>
            </div>
          </div>
        </div>

        {/* Employee Salaries Table */}
        <div className="bg-[#0e0e12] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-8">
          {loading ? (
            <div className="p-24 text-center">
              <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Synchronizing Ledger...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-24 text-center">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
                No active records discovered for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-white/2 border-b border-white/5">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Personnel ID & Name
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Designation
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Gross Payout
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Allocation %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((employee) => {
                    const percentage =
                      totalSalaries > 0
                        ? (employee.salary / totalSalaries) * 100
                        : 0;

                    return (
                      <tr
                        key={employee._id}
                        className="hover:bg-white/2 transition-colors group"
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform inline-block">
                            {employee.name}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {employee.jobTitle}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="text-sm font-black text-blue-500">
                            £{employee.salary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-4">
                            <div className="text-[10px] font-black text-gray-400 w-12 text-right">
                              {percentage.toFixed(1)}%
                            </div>
                            <div className="w-24 bg-white/5 rounded-full h-1 overflow-hidden shadow-inner">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-white/2 border-t border-white/5">
                  <tr>
                    <td colSpan="2" className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">
                      Consolidated Total
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-lg font-black text-white">
                        £{totalSalaries.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-[10px] font-black text-gray-500 uppercase">100.0%</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center text-center group hover:border-white/10 transition-all">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                Average Compensation
              </p>
              <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform">
                £{Math.round(totalSalaries / employees.length).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center text-center group hover:border-blue-500/20 transition-all">
              <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest mb-4">
                Peak Disbursement
              </p>
              <p className="text-3xl font-black text-blue-500 group-hover:scale-105 transition-transform">
                £{Math.max(...employees.map((e) => e.salary)).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0e0e12] p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center text-center group hover:border-white/10 transition-all">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                Base Line Compensation
              </p>
              <p className="text-3xl font-black text-gray-300 group-hover:scale-105 transition-transform">
                £{Math.min(...employees.map((e) => e.salary)).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MonthlySalaries;
