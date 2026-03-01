import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Terminal,
  Globe,
  Server,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface Props {
  name: string;
  args: Record<string, unknown>;
  result?: string;
  isDenied?: boolean;
  isRunning?: boolean;
}

function getToolIcon(name: string) {
  if (name.includes('bash')) return Terminal;
  if (name.includes('ssh')) return Server;
  if (name.includes('web') || name.includes('fetch') || name.includes('search')) return Globe;
  if (name.includes('memory')) return Database;
  return Terminal;
}

function getToolDisplayArgs(name: string, args: Record<string, unknown>): string {
  if (name === 'run_bash_command' && args.command) return `$ ${args.command}`;
  if (name === 'run_ssh_command') return `${args.user || 'root'}@${args.host || '?'} $ ${args.command || ''}`;
  if (name === 'search_web' && args.query) return `🔍 ${args.query}`;
  if (name === 'fetch_webpage' && args.url) return `🌐 ${args.url}`;
  if (name === 'save_memory') return `💾 ${args.key}: ${args.value}`;
  if (name === 'read_memory') return '📖 Чтение памяти';
  if (name === 'delete_memory') return `🗑️ ${args.key}`;
  return JSON.stringify(args, null, 2);
}

export default function ToolBlock({
  name,
  args,
  result,
  isDenied,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getToolIcon(name);
  const displayArgs = getToolDisplayArgs(name, args);
  const isRunning = !result && !isDenied;

  const config = isDenied
    ? { bg: 'bg-danger/[0.05]', border: 'border-danger/20', color: 'text-danger/70', glow: 'shadow-danger/5' }
    : result
    ? { bg: 'bg-success/[0.04]', border: 'border-success/15', color: 'text-success/70', glow: '' }
    : { bg: 'bg-accent/[0.04]', border: 'border-accent/20', color: 'text-accent/70', glow: 'shadow-accent/5' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${config.bg} ${config.border} ${config.glow ? `shadow-sm ${config.glow}` : ''}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left group hover:bg-white/[0.02] transition-colors duration-200"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={13} className="text-text-muted/60" />
        </motion.div>

        {isRunning ? (
          <Loader2 size={14} className="text-accent animate-spin" />
        ) : isDenied ? (
          <XCircle size={14} className="text-danger/70" />
        ) : result ? (
          <CheckCircle2 size={14} className="text-success/70" />
        ) : (
          <Icon size={14} className={config.color} />
        )}

        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
          {name.replace(/_/g, ' ')}
        </span>

        {isRunning && (
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-accent/60"
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
            <div className="px-4 pb-3 space-y-2.5 overflow-y-auto max-h-96">
              {/* Args */}
              <div>
                <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest">
                  Команда
                </span>
                <div className="mt-1.5 p-3 rounded-lg bg-bg-primary/60 border border-border/40 font-mono text-xs text-text-secondary whitespace-pre-wrap break-all leading-relaxed">
                  {displayArgs}
                </div>
              </div>

              {/* Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                      isDenied ? 'text-danger/50' : 'text-text-muted/70'
                    }`}
                  >
                    Результат
                  </span>
                  <div
                    className={`mt-1.5 p-3 rounded-lg bg-bg-primary/60 border font-mono text-xs whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed ${
                      isDenied
                        ? 'border-danger/20 text-danger/60'
                        : 'border-border/40 text-text-secondary'
                    }`}
                  >
                    {result}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
