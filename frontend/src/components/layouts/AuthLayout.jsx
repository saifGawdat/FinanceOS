import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 md:p-8 antialiased">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-6 shadow-xl shadow-blue-600/20">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase">
            FinanceOS
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-bold uppercase tracking-widest">
            Identity Service
          </p>
        </div>
        <div className="bg-[#09090c] border border-white/5 rounded-3xl shadow-2xl shadow-black/50 p-6 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
