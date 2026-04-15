"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { logout } from "@/app/auth/actions";
import { LogOut, Menu, CarFront } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

export function Header({ companyName, companyLogoUrl }: { companyName?: string, companyLogoUrl?: string | null }) {
  const displayName = companyName || "Autoservice";
  const { toggleSidebar, isCollapsed } = useSidebar();

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 flex items-center justify-between shadow-sm border-b border-gray-200 dark:border-gray-800 relative md:sticky md:top-0 z-50 backdrop-blur-xl h-16 transition-colors duration-300">
      <div className="flex items-center h-full px-4 gap-4">
        {/* Hamburger Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Company Identity */}
        <div className="flex items-center gap-3 border-gray-200 dark:border-gray-700 md:pl-4">
          {companyLogoUrl ? (
            <div className="h-10 w-auto min-w-[3rem] max-w-[120px] flex items-center justify-center bg-transparent rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={companyLogoUrl} alt={displayName} className="max-h-full max-w-full object-contain object-center" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <CarFront size={18} />
            </div>
          )}
          {companyLogoUrl ? (
            <>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1" />
              <div className="flex flex-col justify-center text-left hidden sm:flex">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-3 font-medium leading-none mb-1">
                  Autentificat ca
                </span>
                <span className="font-bold text-sm tracking-tight truncate leading-3">
                  {displayName}
                </span>
              </div>
            </>
          ) : (
            <span className="font-semibold tracking-tight truncate hidden sm:block">
              {displayName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4">
        <ThemeToggle />
        
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-gray-50 dark:hover:bg-red-950/20 py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Deconectare</span>
          </button>
        </form>
      </div>
    </header>
  );
}
