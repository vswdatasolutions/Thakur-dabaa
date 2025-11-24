import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, error, className, id, ...props }) => {
  const selectId = id || props.name || `select-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={selectId} className="block text-lg font-medium text-gray-700 dark:text-[#C7C0B0] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`block w-full px-4 py-3 pr-8 border border-gray-300 dark:border-[#2A3C4C] rounded-lg shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white dark:bg-[#3B5974] text-gray-900 dark:text-[#F5F0E1]
                      appearance-none cursor-pointer
                      text-base md:text-lg
                      ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className || ''}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-[#C7C0B0]">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;