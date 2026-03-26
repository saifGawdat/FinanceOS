import { useState } from "react";

const MonthYearSelector = ({ onSelect, initialMonth, initialYear }) => {
  const currentDate = new Date();
  const [month, setMonth] = useState(
    initialMonth || currentDate.getMonth() + 1,
  );
  const [year, setYear] = useState(initialYear || currentDate.getFullYear());

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [];
  for (let i = 2020; i <= currentDate.getFullYear() + 1; i++) {
    years.push(i);
  }

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setMonth(newMonth);
    if (onSelect) {
      onSelect(newMonth, year);
    }
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setYear(newYear);
    if (onSelect) {
      onSelect(month, newYear);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col items-start p-2">
        <label className="text-xs font-medium text-gray-500 mb-1.5 ml-1">
          Month
        </label>
        <select
          value={month}
          onChange={handleMonthChange}
          className="px-3 py-2 bg-transparent border border-white/5 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/3 transition-all duration-300 cursor-pointer shadow-lg shadow-black/20"
        >
          {months.map((m) => (
            <option
              key={m.value}
              value={m.value}
              className="bg-[#0e0e12] text-gray-200"
            >
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col items-start">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
          Year
        </label>
        <select
          value={year}
          onChange={handleYearChange}
          className="px-3 py-2 bg-transparent border border-white/5 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/3 transition-all duration-300 cursor-pointer shadow-lg shadow-black/20"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#0e0e12] text-gray-200">
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MonthYearSelector;
