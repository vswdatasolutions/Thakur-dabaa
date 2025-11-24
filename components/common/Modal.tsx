import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling background
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'w-11/12 max-w-full h-5/6',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 dark:bg-opacity-80"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-[#3B5974] rounded-xl shadow-2xl p-6 md:p-8 transform transition-all duration-300 ease-out scale-100 opacity-100 ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="modal-title" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F5F0E1]">
            {title}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            ✖
          </Button>
        </div>
        <div className="modal-content text-gray-800 dark:text-[#C7C0B0] text-lg md:text-xl leading-relaxed">
          {children}
        </div>
        {footer && (
          <div className="modal-footer mt-6 pt-4 border-t border-gray-200 dark:border-[#2A3C4C] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;