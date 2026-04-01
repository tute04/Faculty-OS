import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-base/70 backdrop-blur-[20px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              'relative z-10 w-full flex flex-col',
              'bg-[rgba(13,11,8,0.75)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.06)] rounded-card shadow-2xl',
              size === 'sm' && 'max-w-sm',
              size === 'md' && 'max-w-lg',
              size === 'lg' && 'max-w-2xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-[15px] font-medium text-text-primary tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-[6px] hover:bg-hover"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
