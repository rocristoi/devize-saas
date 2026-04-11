"use client";

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function CustomDatePicker({ className, ...props }: CustomDatePickerProps) {
  return (
    <div className={cn("relative group", className)}>
      <input 
        type="date"
        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 border-blue-500 transition-colors shadow-sm cursor-pointer appearance-none date-input-hidden-icon h-11"
        {...props}
      />
      <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-colors group-focus-within:text-blue-500" />
      <style jsx global>{`
        /* Remove default calendar pickers across browsers */
        .date-input-hidden-icon::-webkit-calendar-picker-indicator {
          background: transparent;
          color: transparent;
          cursor: pointer;
          height: auto;
          width: auto;
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          left: 0;
        }
      `}</style>
    </div>
  );
}
