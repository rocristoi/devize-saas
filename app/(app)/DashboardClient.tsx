"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

interface DashboardDashboardClientProps {
  devizeCount: number;
  clientsCount: number;
  subscriptionStateText: string;
  subscriptionSubtext: string;
  companyName: string;
}

export function DashboardClient({
  devizeCount,
  clientsCount,
  subscriptionStateText,
  subscriptionSubtext,
  companyName
}: DashboardDashboardClientProps) {
  const isExpired = subscriptionStateText === "Expirat" || subscriptionStateText === "Inactiv";
  
  return (
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-blue-900 dark:from-gray-800 dark:to-blue-950 p-8 sm:p-10 shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight"
          >
            Sistemul Tău, {companyName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-300 text-lg mb-8 max-w-xl line-height-relaxed"
          >
            Gestionează rapid devizele și reparațiile într-un mediu profesionist. Ai acces instant la istoricul clienților tăi.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link 
              href="/devize/nou" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <FileText className="w-5 h-5" />
              Deviz Nou
            </Link>
            <Link 
              href="/devize" 
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-lg backdrop-blur-sm border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Istoric Devize
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm tracking-wide">Devize Luna Curentă</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <span className="block text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{devizeCount}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200/60 dark:border-gray-700/60 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm tracking-wide">Clienți Noi</h3>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="block text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{clientsCount}</span>
        </motion.div>

        <motion.div variants={itemVariants} className={`group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border ${isExpired ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200/60 dark:border-gray-700/60'} hover:shadow-xl transition-all overflow-hidden`}>
          <div className={`absolute right-0 top-0 w-24 h-24 bg-gradient-to-br ${isExpired ? 'from-red-50 dark:from-red-900/20' : 'from-indigo-50 dark:from-indigo-900/20'} to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110`} />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm tracking-wide">Abonament Curent</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-2xl font-bold tracking-tight mb-1 ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {subscriptionStateText}
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {subscriptionSubtext}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
