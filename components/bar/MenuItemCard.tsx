import React from 'react';
import { BarMenuItem } from '../../types';
import Button from '../common/Button';

interface MenuItemCardProps {
  item: BarMenuItem;
  onAddItem: (item: BarMenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddItem }) => {
  return (
    <div className="bg-gray-50 dark:bg-[#4C769A] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between items-start border border-gray-200 dark:border-[#2A3C4C]">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-2">{item.name}</h3>
      <p className="text-xl text-gray-700 dark:text-[#C7C0B0] flex-grow mb-3">{item.category}</p>
      <div className="w-full flex justify-between items-center mt-auto">
        <span className="text-2xl font-bold text-blue-600 dark:text-[#F5F0E1]">
          ₹{item.price.toLocaleString('en-IN')}
          {item.unit && <span className="text-base text-gray-600 dark:text-[#C7C0B0]"> / {item.unit}</span>}
        </span>
        <Button variant="primary" size="lg" onClick={() => onAddItem(item)} className="ml-4 text-xl">
          + Add
        </Button>
      </div>
    </div>
  );
};

export default MenuItemCard;