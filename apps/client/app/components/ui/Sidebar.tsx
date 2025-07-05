import React, { useState } from 'react';
import { X, Menu, Home, User, Settings, Mail, Bell, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dispatch, SetStateAction } from 'react';


interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface OverlaySidebarProps {
  items?: SidebarItem[];
  className?: string;
  isOpen:boolean;
  setIsOpen:React.Dispatch<SetStateAction<boolean>>
}

const defaultItems: SidebarItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Mail, label: 'Messages', href: '/messages' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const OverlaySidebar: React.FC<OverlaySidebarProps> = ({ 
  items = defaultItems, 
  className,
  isOpen,
  setIsOpen 
}) => {
//   const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleItemClick = (item: SidebarItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
    closeSidebar();
  };

  return (
    <div className='relative z-50 bg-slate-700 '>
      {/* Trigger Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 p-3 bg-white shadow-lg rounded-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 hover:scale-105",
          className
        )}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-slate-400 shadow-2xl z-50 transform transition-transform duration-300 ease-out border-r border-gray-200",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 ">
          <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-200" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              className="w-full flex items-center gap-4 p-3 text-left hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1 group"
            >
              <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-gray-900">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        
      </div>
    </div>
  );
};

export default OverlaySidebar;
