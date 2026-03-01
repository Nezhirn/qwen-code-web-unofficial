import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Brain } from 'lucide-react';

interface Props {
  content: string;
  isStreaming?: boolean;
}

export default function ThinkingBlock({ content, isStreaming }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        isStreaming
          ? 'bg-warning/[0.06] border-warning/25 shadow-sm shadow-warning/5'
          : 'bg-warning/[0.04] border-warning/15'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left group hover:bg-warning/[0.03] transition-colors duration-200"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={13} className="text-warning/50" />
        </motion.div>
        <Brain
          size={14}
          className={`text-warning/70 ${isStreaming ? 'animate-pulse' : ''}`}
        />
        <span className="text-xs font-semibold text-warning/60 uppercase tracking-wider">
          Размышления
        </span>
        {isStreaming && (
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-warning/60"
                animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 overflow-y-auto max-h-80">
              <div className="text-xs text-warning/50 whitespace-pre-wrap leading-relaxed font-mono">
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
