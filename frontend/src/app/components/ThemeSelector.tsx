'use client';

import React, { useEffect, useState } from 'react';
import { Palette, Sun, Moon, Settings } from 'lucide-react';
import { useToast } from './ToastProvider';

export default function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'default' | 'black' | 'white'>('default');
  const { showToast } = useToast();

  useEffect(() => {
    // Read theme from localStorage on mount
    const savedTheme = localStorage.getItem('studycircle-bg-theme') as 'default' | 'black' | 'white';
    if (savedTheme && ['default', 'black', 'white'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyThemeClass(savedTheme);
    }
  }, []);

  const applyThemeClass = (themeMode: 'default' | 'black' | 'white') => {
    const htmlEl = document.documentElement;
    htmlEl.classList.remove('theme-bg-black', 'theme-bg-white');
    
    if (themeMode === 'black') {
      htmlEl.classList.add('theme-bg-black');
    } else if (themeMode === 'white') {
      htmlEl.classList.add('theme-bg-white');
    }
  };

  const handleSelectTheme = (mode: 'default' | 'black' | 'white') => {
    setTheme(mode);
    applyThemeClass(mode);
    localStorage.setItem('studycircle-bg-theme', mode);
    setOpen(false);
    
    let msg = 'Switched to Default theme';
    if (mode === 'black') msg = 'Switched to Pure Black background';
    if (mode === 'white') msg = 'Switched to Light White background';
    showToast(msg, 'info');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 font-sans">
      {/* Floating Menu options */}
      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-32 animate-slideIn">
          <button
            onClick={() => handleSelectTheme('default')}
            className={`px-3 py-2 text-left text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'default'
                ? 'bg-violet-600 text-white'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Default
          </button>
          
          <button
            onClick={() => handleSelectTheme('black')}
            className={`px-3 py-2 text-left text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'black'
                ? 'bg-violet-600 text-white'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Pure Black
          </button>

          <button
            onClick={() => handleSelectTheme('white')}
            className={`px-3 py-2 text-left text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'white'
                ? 'bg-violet-600 text-white'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Pure White
          </button>
        </div>
      )}

      {/* Main trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 bg-violet-600 hover:bg-violet-500 text-white border border-violet-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-violet-600/30 active:scale-95 transition-all cursor-pointer relative"
        title="Change Background Theme"
      >
        <Palette className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
