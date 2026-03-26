import React from "react";

const Card = ({ children, className = "", title, subtitle }) => {

  return (
    <div
      className={`bg-[#0e0e12] rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 ${className}`}
    >
      {title && (
        <div className="mb-6 relative">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-xl font-bold text-gray-100 tracking-tight">{title}</h3>
          {subtitle && <p className="text-gray-500 text-xs mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};


export default Card;
