"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  parseISO,
  isValid
} from "date-fns";
import { ro } from "date-fns/locale";

interface CustomDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string | Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
}

export function CustomDatePicker({ value, onChange, className, placeholder = "Selectează data...", disabled, ...props }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  useEffect(() => {
    if (selectedDate && isOpen) {
      setCurrentMonth(prevMonth => {
        if (isSameMonth(prevMonth, selectedDate) && prevMonth.getFullYear() === selectedDate.getFullYear()) {
          return prevMonth;
        }
        return selectedDate;
      });
    }
  }, [selectedDate, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    onChange?.(day);
    setIsOpen(false);
  };

  const formattedValue = selectedDate ? format(selectedDate, "dd.MM.yyyy") : "";

  return (
    <div className={cn("relative w-full text-sm", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between form-input",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900/50"
        )}
      >
        <span className={cn(
          "truncate font-medium transition-colors",
          !selectedDate ? "text-gray-400 dark:text-gray-500 font-normal" : "text-gray-900 dark:text-gray-100"
        )}>
          {selectedDate ? format(selectedDate, dateFormat, { locale: ro }) : placeholder}
        </span>
        <CalendarIcon className={cn(
          "w-4 h-4 transition-colors",
          isOpen ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 4, scale: 0.98, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute z-50 mt-2 p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] w-72"
          >
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                {format(currentMonth, "MMMM yyyy", { locale: ro })}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => onDateClick(day)}
                    className={cn(
                      "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                      !isCurrentMonth && "text-gray-300 dark:text-zinc-600 cursor-default hover:bg-transparent",
                      isCurrentMonth && !isSelected && "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300",
                      isSelected && "bg-blue-500 text-white shadow-md shadow-blue-500/30 font-semibold",
                      isToday && !isSelected && "ring-1 ring-inset ring-blue-500 text-blue-600 dark:text-blue-400 font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-center">
              <button
                type="button"
                onClick={() => onDateClick(new Date())}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Mergi la ziua de azi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
