import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const inputId = id || props.name || `input-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-lg font-medium text-gray-700 dark:text-[#C7C0B0] mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full px-4 py-3 border border-gray-300 dark:border-[#2A3C4C] rounded-lg shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    bg-white dark:bg-[#3B5974] text-gray-900 dark:text-[#F5F0E1] placeholder-gray-500 dark:placeholder-[#C7C0B0]
                    text-base md:text-lg
                    ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;