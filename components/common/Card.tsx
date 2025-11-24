import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, title, className }) => {
  return (
    <div className={`bg-white dark:bg-[#3B5974] rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-[#2A3C4C] ${className || ''}`}>
      {title && (
        <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-6">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Card;