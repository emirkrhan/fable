'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

const STORAGE_KEY = 'story-planner:whats-new:dismissed';
const CURRENT_VERSION = 'v1.2.0'; // Bu versiyonu güncelleyerek yeni duyuruları gösterebilirsin

export default function WhatsNewCard() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Check if user has dismissed this version
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== CURRENT_VERSION) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-50 w-72"
        >
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-500/10 rounded">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold">What's New</h3>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <p className="text-muted-foreground">
                  <strong className="text-foreground font-medium">List Card</strong> for checklists and todos
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <p className="text-muted-foreground">
                  <strong className="text-foreground font-medium">Light/Dark Mode</strong> toggle
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <p className="text-muted-foreground">
                  <strong className="text-foreground font-medium">Image Card</strong> for visual references
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
