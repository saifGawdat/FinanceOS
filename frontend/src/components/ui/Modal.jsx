import React from "react";
import { IoClose } from "react-icons/io5";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-[#09090c] border border-white/5 rounded-2xl shadow-2xl shadow-black/80 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg p-1.5 transition-all duration-150"
            aria-label="Close modal"
          >
            <IoClose size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
