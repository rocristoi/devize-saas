"use client";

import { motion } from "framer-motion";
import {  ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background decoration matching dashboard pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-60 dark:opacity-40 pointer-events-none" />
      <div className="absolute top-[10%] left-[15%] w-[35%] h-[60%] bg-blue-100/40 dark:bg-blue-900/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[50%] bg-slate-200/50 dark:bg-slate-800/40 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />

      {/* Content card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-lg w-full">

        {/* 404 number */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-sm font-semibold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-3"
        >
          Eroare 404
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4"
        >
          Pagină negăsită
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed mb-10"
        >
          Pagina pe care o cauți nu există sau a fost mutată. Verifică adresa URL sau întoarce-te la panou.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-sm transition-colors w-full sm:w-auto"
          >
            <Home size={18} />
            Panou Control
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center cursor-pointer justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors w-full sm:w-auto"
          >
            <ArrowLeft size={18} />
            Înapoi
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800 w-full flex flex-col sm:flex-row items-center justify-center gap-1 text-sm text-gray-400 dark:text-gray-600"
        >
          <span>Ai nevoie de ajutor?</span>
          <Link
            href="/suport"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Contactează suportul
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
