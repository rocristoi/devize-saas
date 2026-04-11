"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  History, 
  Settings, 
  PackageSearch,
  CreditCard,
  LayoutDashboard
} from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const MENU_ITEMS = [
    { name: "Panou Control", href: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Deviz Nou", href: "/devize/nou", icon: <FileText size={20} /> },
    { name: "Istoric Devize", href: "/devize", icon: <History size={20} /> },
    { name: "Gestiune Piese", href: "/piese", icon: <PackageSearch size={20} /> },
    { name: "Abonament", href: "/abonament", icon: <CreditCard size={20} /> },
    { name: "Setări", href: "/setari", icon: <Settings size={20} /> },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative z-20 overflow-hidden flex-shrink-0 transition-colors"
    >
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <AnimatePresence mode="popLayout" initial={false}>
          {!isCollapsed ? (
            <motion.span
              layoutId="sidebar-brand-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-[15px] tracking-tight text-gray-400 dark:text-gray-500 uppercase"
            >
              Meniu principal
            </motion.span>
          ) : (
            <motion.div
              layoutId="sidebar-brand-icon"
              className="flex items-center justify-center w-full"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-hide">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center h-10 px-2 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-50"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute -left-4 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-600 dark:bg-blue-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={cn("flex-shrink-0 w-8 flex items-center transition-colors", isCollapsed ? "justify-center" : "justify-start ml-2", isActive ? "text-blue-600 dark:text-blue-400" : "")}>
                {item.icon}
              </div>

              <AnimatePresence mode="popLayout" initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap ml-2 overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}