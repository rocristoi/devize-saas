"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Search, 
  History, 
  Settings, 
  PackageSearch,
  HelpCircle,
  CarFront,
  CreditCard
} from "lucide-react";

export function TopNavigation() {
  const pathname = usePathname();

  const MENU_ITEMS = [
    { name: "Panou de control", href: "/", icon: <CarFront size={16} /> },
    { name: "Deviz nou", href: "/devize/nou", icon: <FileText size={16} /> },
    { name: "Istoric Devize", href: "/devize", icon: <History size={16} /> },
    { name: "Gestiune Piese", href: "/piese", icon: <PackageSearch size={16} /> },
    { name: "Căutare", href: "/cautare", icon: <Search size={16} /> },
    { name: "Abonament", href: "/abonament", icon: <CreditCard size={16} /> },
    { name: "Setări", href: "/setari", icon: <Settings size={16} /> },
  ];

  return (
    <div className="mb-4 overflow-x-auto scrollbar-hide">
      <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 min-w-max">
        {MENU_ITEMS.map((item) => {
          const isActive = 
            item.href === "/devize"
              ? pathname === "/devize" || (pathname.startsWith("/devize/") && !pathname.startsWith("/devize/nou"))
              : item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-gray-700 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}