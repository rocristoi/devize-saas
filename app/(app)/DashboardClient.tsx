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
    <div className="space-y-8 pb-12 w-full">
      {/* Hero Section Container */}
      <div className="relative w-full pb-10 mb-6">
        {/* 
          Absolute Full Width Background Breakout 
          Using left-1/2 right-1/2 with -ml/-mr 50vw explicitly avoids the overflow-x issues
          while maintaining a perfect edge-to-edge bleed.
        */}
        <div className="absolute top-[-1rem] md:top-[-1.5rem] lg:top-[-2rem] bottom-0 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pointer-events-none -z-20 overflow-hidden">
          {/* Clean, high-tech dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,transparent_100%)] opacity-60 dark:opacity-40" />
          
          {/* Subtle glowing gradients for a modern SaaS aesthetic */}
          <div className="absolute top-0 left-[10%] w-[40%] h-full bg-blue-100/40 dark:bg-blue-900/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute top-0 right-[10%] w-[30%] h-full bg-slate-200/50 dark:bg-slate-800/40 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
        </div>

        {/* Content - Constrained to max-w-6xl from layout.tsx */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 pt-4 md:pt-8 w-full">
          <div className="max-w-2xl flex-shrink-0">
        
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
            >
              Salut, {companyName}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-8"
            >
              Gestionează rapid devizele și reparațiile într-un mediu profesionist. Ai acces instant la istoricul clienților și vehiculelor.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link 
                href="/devize/nou" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-sm transition-colors"
              >
                <FileText className="w-5 h-5" />
                Deviz Nou
              </Link>
              <Link 
                href="/devize" 
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
              >
                Istoric Devize
              </Link>
            </motion.div>
          </div>

          {/* Custom Auto-Shop Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block relative w-[400px] xl:w-[450px] h-[300px] shrink-0"
          >
            {/* SVG Base Graphic */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background structural circles */}
              <circle cx="200" cy="150" r="100" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1.5" strokeDasharray="4 6" />
              <circle cx="200" cy="150" r="140" className="stroke-gray-200/60 dark:stroke-gray-800" strokeWidth="1.5" strokeDasharray="8 10" />
              
              {/* Diagnostic pulse line */}
              <path d="M 10,160 L 70,160 L 100,100 L 150,230 L 210,70 L 250,160 L 390,160" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              <circle cx="150" cy="230" r="5" className="fill-blue-500" opacity="0.6" />
              <circle cx="210" cy="70" r="5" className="fill-blue-500" opacity="0.6" />

              {/* Car Wireframe Silhouette */}
              <path d="M 80,180 C 80,140 110,130 140,110 C 160,95 190,95 230,95 C 270,95 300,110 320,135 C 330,145 350,155 350,180" className="stroke-gray-800 dark:stroke-gray-300" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 60,180 L 100,180 M 160,180 L 260,180 M 320,180 L 370,180" className="stroke-gray-800 dark:stroke-gray-300" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Automotive Blueprint Nodes */}
              <circle cx="140" cy="110" r="4" className="fill-gray-800 dark:fill-gray-300" />
              <circle cx="230" cy="95" r="4" className="fill-gray-800 dark:fill-gray-300" />
              <circle cx="320" cy="135" r="4" className="fill-gray-800 dark:fill-gray-300" />

              {/* Wheels */}
              <circle cx="130" cy="180" r="26" className="fill-gray-50 dark:fill-gray-900 stroke-gray-800 dark:stroke-gray-300" strokeWidth="4.5" />
              <circle cx="290" cy="180" r="26" className="fill-gray-50 dark:fill-gray-900 stroke-gray-800 dark:stroke-gray-300" strokeWidth="4.5" />
              
              <circle cx="130" cy="180" r="8" className="fill-blue-500" />
              <circle cx="290" cy="180" r="8" className="fill-blue-500" />

              {/* Speedy motion dashes */}
              <path d="M 20,120 L 50,120 M 0,140 L 40,140" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Floating Abstract UI Elements */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: -15 }} 
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              style={{ willChange: "transform" }}
              className="absolute top-8 -right-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-3 w-48"
            >
              <div className="flex justify-between items-center">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">DEVIZ REPARAȚIE</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/60 w-3/4 rounded-full"></div>
                </div>
                <div className="h-1.5 w-2/3 bg-gray-200/60 dark:bg-gray-700/60 rounded-full"></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: -12 }} 
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
              style={{ willChange: "transform" }}
              className="absolute bottom-16 -left-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 p-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full border-[1.5px] border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-full"></div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-1.5 w-16 bg-gray-300/80 dark:bg-gray-600/80 rounded-full"></div>
                <div className="h-1.5 w-10 bg-gray-200/80 dark:bg-gray-700/80 rounded-full"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4"
      >
        <div className="relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-5 transition-transform group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
            <Activity className="w-36 h-36 text-gray-900 dark:text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-widest">Devize Luna Curentă</h3>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="block text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{devizeCount}</span>
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-5 transition-transform group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
            <Users className="w-36 h-36 text-gray-900 dark:text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-widest">Clienți Noi</h3>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="block text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{clientsCount}</span>
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">luna aceasta</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border ${isExpired ? 'border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} hover:shadow-lg transition-all overflow-hidden group`}>
          <div className={`absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-5 transition-transform group-hover:scale-110 group-hover:-rotate-12 pointer-events-none ${isExpired ? 'text-red-900 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
            <CreditCard className="w-36 h-36" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-widest">Abonament Curent</h3>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-extrabold tracking-tight mb-1 ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {subscriptionStateText}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {subscriptionSubtext}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
