"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  PackageSearch, 
  Settings, 
  Menu, 
  X, 
  Search, 
  CreditCard, 
  HelpCircle,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { name: "Panou", href: "/", icon: <LayoutDashboard size={24} /> },
    { name: "Deviz Nou", href: "/devize/nou", icon: <FileText size={24} /> },
    { name: "Istoric", href: "/devize", icon: <History size={24} /> },
    { name: "Piese", href: "/piese", icon: <PackageSearch size={24} /> },
  ];

  const MORE_ITEMS = [
    { name: "Căutare", href: "/cautare", icon: <Search size={24} /> },
    { name: "Abonament", href: "/abonament", icon: <CreditCard size={24} /> },
    { name: "Facturi", href: "/facturi", icon: <ReceiptText size={24} /> },
    { name: "Suport", href: "/suport", icon: <HelpCircle size={24} /> },
    { name: "Setări", href: "/setari", icon: <Settings size={24} /> },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <ul className="flex justify-between items-center h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = 
              item.href === "/devize"
                ? pathname === "/devize" || (pathname.startsWith("/devize/") && !pathname.startsWith("/devize/nou"))
                : item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className="flex-1 text-center">
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center h-full w-full gap-1 transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-500"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium leading-none">{item.name}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1 text-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "flex flex-col items-center justify-center h-full w-full gap-1 transition-colors",
                isMenuOpen
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              <span className="text-[10px] font-medium leading-none">Meniu</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div 
        className={cn(
          "md:hidden fixed left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-40 transition-transform duration-300 ease-in-out px-4 pt-6 pb-24 shadow-xl border-t border-gray-200 dark:border-gray-800",
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ bottom: "0" }}
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
        <div className="grid grid-cols-5 gap-3">
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                {item.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
