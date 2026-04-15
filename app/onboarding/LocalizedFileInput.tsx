"use client";

import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export function LocalizedFileInput({ name, accept }: { name: string, accept?: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        name={name} 
        accept={accept} 
        className="hidden" 
        ref={inputRef} 
        onChange={handleChange}
      />
      <div className="flex items-center gap-4">
        <button 
          type="button" 
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold border border-blue-200 dark:border-blue-800/50 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Alegeți fișierul
        </button>
        <span className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-xs">
          {fileName || 'Niciun fișier selectat'}
        </span>
      </div>
    </div>
  );
}
