import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1F2D3A]';
  const disabledStyles = 'opacity-60 cursor-not-allowed';
  const loadingStyles = 'relative pointer-events-none';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:text-[#F5F0E1] focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-[#5C86AA] dark:hover:bg-[#4C769A] text-gray-800 dark:text-[#1F2D3A] focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white dark:text-[#F5F0E1] focus:ring-red-500',
    outline: 'border border-gray-300 dark:border-[#5C86AA] text-gray-800 dark:text-[#F5F0E1] hover:bg-gray-100 dark:hover:bg-[#3B5974] focus:ring-gray-400',
    ghost: 'text-gray-800 dark:text-[#F5F0E1] hover:bg-gray-100 dark:hover:bg-[#3B5974] focus:ring-gray-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg', // Larger for tablet touch
    icon: 'p-2 text-xl', // For icons, larger touch target
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled || isLoading ? disabledStyles : ''
      } ${isLoading ? loadingStyles : ''} ${className || ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
};

export default Button;