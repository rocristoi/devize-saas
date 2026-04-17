"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  ShieldCheck,
  Plus,
  Bell,
  Calendar,
  X,
  ChevronRight,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface Announcement {
  id: string;
  created_at: string;
  title: string;
  image_url: string | null;
  short_description: string;
  body: string;
}

interface DashboardDashboardClientProps {
  devizeCount: number;
  clientsCount: number;
  subscriptionStateText: string;
  subscriptionSubtext: string;
  companyName: string;
  announcements: Announcement[];
}

export function DashboardClient({
  devizeCount,
  clientsCount,
  subscriptionStateText,
  subscriptionSubtext,
  companyName,
  announcements
}: DashboardDashboardClientProps) {
  const isExpired = subscriptionStateText === "Expirat" || subscriptionStateText === "Inactiv";
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="pb-12 w-full">
      {/* Hero Section - True Full Width */}
      <div 
        className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 mb-6 pb-12 -mt-4 md:-mt-6 lg:-mt-8" 
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        
        {/* Dots pattern - desktop only to avoid harsh look on mobile dark */}
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        {/* Mobile: soft radial glow accent */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-500/10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-70 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-zinc-100 dark:bg-zinc-900/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

       

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 max-w-6xl w-full mx-auto h-full px-4 md:px-6 lg:px-8 pt-8 md:pt-14">
          {/* Left Text Content & Buttons */}
          <div className="flex-1 max-w-2xl text-center md:text-left z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4 md:mb-6"
            >
              {companyName}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto md:mx-0 leading-relaxed"
            >
              Bun venit în panoul tău de control. Creează devize, gestionează reparațiile și menține evidența pieselor cu ușurință într-o singură interfață.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 shrink-0"
            >
              <Link 
                href="/devize/nou" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold px-6 py-3 md:px-8 md:py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                aria-label="Creează un deviz nou"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                
                 Deviz Nou
              </Link>
              <Link 
                href="/devize" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:text-white font-medium px-6 py-3 md:px-8 md:py-3.5 rounded-lg transition-all shadow-sm hover:shadow"
                aria-label="Vezi istoricul devizelor"
              >
                Istoric Devize
              </Link>
            </motion.div>
          </div>

          {/* Right Illustration Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-1 w-full max-w-lg hidden md:flex relative justify-center items-center"
          >
            {/* Abstract UI representation */}
            <div className="relative w-full aspect-square max-w-[400px]">
              {/* Central stylized car shape */}
              <motion.div 
                className="absolute inset-0 m-auto w-48 h-48 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl dark:shadow-zinc-950 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center z-20"
              >
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-900 dark:text-white">
                  {/* Use car.svg image instead */}
                  <Image src="/car.svg" alt="Car" width={96} height={96} />
                </div>
              </motion.div>

              {/* Floating element 1 - Wrench */}
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [-10, 10, -10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-8 left-4 w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center z-30"
              >
                <Wrench className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />
              </motion.div>

              {/* Floating element 2 - Notification/Stats */}
              <motion.div 
                animate={{ y: [0, 20, 0], x: [0, 5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-12 right-5 w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 p-3 flex items-center gap-3 z-30"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
               
              </motion.div>

              {/* Background accent ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 z-10"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 md:space-y-12">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 md:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Volum Devize</h3>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white block mb-1">{devizeCount}</span>
            <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-500">Înregistrate luna aceasta</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 md:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Clienți Noi</h3>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white block mb-1">{clientsCount}</span>
            <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-500">Adăugați recent</span>
          </div>
        </div>

        <div className={`rounded-xl p-5 md:p-6 border shadow-sm sm:col-span-2 lg:col-span-1 ${
          isExpired 
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30' 
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Abonament Software</h3>
            <div className={`p-2 rounded-md ${
              isExpired 
                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}>
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white block mb-1">
              {subscriptionStateText}
            </span>
            <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-500">
              {subscriptionSubtext}
            </span>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="pt-2 md:pt-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Noutăți
          </h2>
        </div>

        {announcements.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 border-dashed dark:border-gray-800 p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">Jurnal gol</p>
            <p className="text-gray-500 text-sm max-w-sm">Nu a fost publicată nicio actualizare în mod curent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id}
                onClick={() => setSelectedAnnouncement(announcement)}
                className="group flex flex-col cursor-pointer border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 pb-4 transition-colors"
              >
                {announcement.image_url && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg mb-4 border border-gray-200 dark:border-gray-800 relative">
                    <Image 
                      src={announcement.image_url} 
                      alt={announcement.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(announcement.created_at).toLocaleDateString('ro-RO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 leading-snug group-hover:underline decoration-gray-300 dark:decoration-gray-700 underline-offset-4">
                  {announcement.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {announcement.short_description}
                </p>
                <div className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  Detalii <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div></div>

      {/* Announcement Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedAnnouncement && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 p-safe">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedAnnouncement(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-gray-200 dark:border-gray-800"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {selectedAnnouncement.title}
                  </h3>
                  <button 
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="overflow-y-auto px-6 py-6">
                  {selectedAnnouncement.image_url && (
                    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6 relative">
                      <Image 
                        src={selectedAnnouncement.image_url} 
                        alt={selectedAnnouncement.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnnouncement.created_at).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {/* Notice: since the body is HTML, we use dangerouslySetInnerHTML */}
                  <div 
                    className="max-w-none text-gray-700 dark:text-gray-300 space-y-4
                      [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:dark:text-white
                      [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:dark:text-white
                      [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:dark:text-white
                      [&>p]:leading-relaxed [&>a]:text-blue-600 [&>a]:hover:underline
                      [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5
                      [&>img]:rounded-xl [&>img]:w-full [&>img]:my-4"
                    dangerouslySetInnerHTML={{ __html: selectedAnnouncement.body }} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
