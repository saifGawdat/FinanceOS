import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}) => {
  const baseClasses =
    "px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#060608]";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500/50 active:bg-blue-700",
    secondary:
      "bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] hover:text-gray-100 focus:ring-white/20 border border-white/[0.06]",
    danger:
      "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50 active:bg-red-700",
    outline:
      "border border-blue-600/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 focus:ring-blue-500/50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
