import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import {
  IoHomeOutline,
  IoWalletOutline,
  IoCartOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoCashOutline,
  IoStatsChartOutline,
  IoSettingsOutline,
  IoTrophyOutline,
  IoRepeatOutline,
  IoReceiptOutline,
} from "react-icons/io5";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isRtl = i18n.language === "ar";
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", icon: IoHomeOutline, label: t("sidebar.dashboard") },
    { path: "/income", icon: IoWalletOutline, label: t("sidebar.income") },
    { path: "/expense", icon: IoCartOutline, label: t("sidebar.expenses") },
    { path: "/goals", icon: IoTrophyOutline, label: t("sidebar.goals") },
    { path: "/recurring", icon: IoRepeatOutline, label: t("sidebar.recurring") },
    { path: "/employees", icon: IoPeopleOutline, label: t("sidebar.employees") },
    { path: "/monthly-salaries", icon: IoCashOutline, label: t("sidebar.salaries") },
    { path: "/profit-summary", icon: IoStatsChartOutline, label: t("sidebar.profit") },
    { path: "/customers", icon: IoPeopleOutline, label: t("sidebar.customers") },
    { path: "/invoices", icon: IoReceiptOutline, label: "Invoices" },
    { path: "/settings", icon: IoSettingsOutline, label: t("sidebar.settings") },
  ];

  return (
    <div className="h-screen bg-[#060608] text-gray-300 antialiased flex flex-col overflow-hidden">
      {/* Mobile header - Takes up fixed height when visible */}
      <div className="lg:hidden bg-[#09090c] border-b border-white/5 p-4 flex justify-between items-center z-30 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-gray-400"
        >
          {sidebarOpen ? (
            <IoCloseOutline size={24} />
          ) : (
            <IoMenuOutline size={24} />
          )}
        </button>
        <h1 className="text-sm font-bold text-white tracking-tight absolute left-1/2 -translate-x-1/2">
          FinanceOS
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 ${isRtl ? "right-0" : "left-0"} z-50 w-64 bg-[#09090c] border-r border-white/5 transform transition-transform duration-300 ease-in-out h-full flex flex-col
          ${sidebarOpen ? "translate-x-0" : isRtl ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          {/* Logo Section */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <IoStatsChartOutline className="text-white" size={14} />
              </div>
              <h1 className="text-base font-bold text-white tracking-tight">
                FinanceOS
              </h1>
            </div>
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.18em] font-bold ml-10 rtl:ml-0 rtl:mr-10">
              {t("sidebar.management")}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-5 overflow-hidden">
            <div>
              <p className="px-3 text-[9px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-3">
                {t("sidebar.main_menu")}
              </p>
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                        location.pathname === item.path
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-gray-500 hover:text-gray-200 hover:bg-white/3"
                      }`}
                    >
                      <item.icon
                        size={16}
                        className={
                          location.pathname === item.path
                            ? ""
                            : "group-hover:text-blue-400 transition-colors"
                        }
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Profile & Logout */}
          <div className="p-3 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-3 px-3 py-3 mb-1">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-200 truncate">
                  {user?.name}
                </p>
                <p className="text-[9px] text-gray-600 font-medium truncate uppercase tracking-tighter">
                  {t("sidebar.administrator")}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-[11px] font-bold transition-all"
            >
              <IoLogOutOutline size={16} />
              <span>{t("sidebar.logout")}</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content - Scrollable area */}
        <main className="flex-1 bg-[#060608] h-full overflow-y-auto custom-scrollbar">
          <div className="max-w-[1440px] mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
