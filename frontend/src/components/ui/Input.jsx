import React from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  name,
  className = "",
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-300 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/2 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 ${className}`}
      />
    </div>
  );
};

export default Input;
