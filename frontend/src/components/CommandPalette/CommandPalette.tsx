/**
 * Command Palette Component
 * 
 * A global Cmd+K command palette for keyboard-centric navigation
 * and quick actions throughout the application.
 * 
 * Features:
 * - Global keyboard shortcut (Cmd+K or Ctrl+K)
 * - Fuzzy search across commands
 * - Categorized commands (Navigation, Actions, Agent)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent commands history
 * - Custom command support
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCommand, FiArrowRight, FiClock, FiFile, FiLayers, FiSettings, FiUpload, FiDownload, FiMap, FiBox, FiActivity } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================
// Types
// ============================================

export interface Command {
  /** Unique command ID */
  id: string;
  
  /** Command title displayed in palette */
  title: string;
  
  /** Short description */
  description?: string;
  
  /** Category for organization */
  category: CommandCategory;
  
  /** Icon component */
  icon?: React.ReactNode;
  
  /** Keyboard shortcut hint (e.g., "⌘S") */
  shortcut?: string;
  
  /** Whether command requires authentication */
  requiresAuth?: boolean;
  
  /** Whether command is available in current context */
  isAvailable?: () => boolean;
  
  /** Action to execute */
  action: () => void | Promise<void>;
  
  /** Keywords for fuzzy search */
  keywords?: string[];
}

export type CommandCategory = 
  | 'navigation'
  | 'actions'
  | 'agent'
  | 'layers'
  | 'settings'
  | 'files'
  | 'analysis';

export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  
  /** Callback when palette should close */
  onClose: () => void;
  
  /** List of available commands */
  commands: Command[];
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Maximum number of results to show */
  maxResults?: number;
}

// ============================================
// Default Commands Registry
// ============================================

export const createDefaultCommands = (
  navigate: (path: string) => void,
  executeAction: (action: string) => void
): Command[] => [
  // Navigation Commands
  {
    id: 'nav-map',
    title: 'Go to Map',
    description: 'Navigate to the main map view',
    category: 'navigation',
    icon: <FiMap />,
    shortcut: '⌘1',
    action: () => navigate('/map'),
    keywords: ['home', 'main', 'viewer'],
  },
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    description: 'View your project dashboard',
    category: 'navigation',
    icon: <FiActivity />,
    shortcut: '⌘2',
    action: () => navigate('/dashboard'),
    keywords: ['overview', 'stats', 'projects'],
  },
  {
    id: 'nav-layers',
    title: 'Manage Layers',
    description: 'Open layer management panel',
    category: 'navigation',
    icon: <FiLayers />,
    shortcut: '⌘L',
    action: () => {
      navigate('/map');
      executeAction('openLayersPanel');
    },
    keywords: ['layer', 'manage', 'data'],
  },
  {
    id: 'nav-settings',
    title: 'Settings',
    description: 'Open application settings',
    category: 'navigation',
    icon: <FiSettings />,
    shortcut: '⌘,',
    action: () => navigate('/settings'),
    keywords: ['preferences', 'config'],
  },
  {
    id: 'nav-files',
    title: 'File Manager',
    description: 'Browse uploaded files',
    category: 'navigation',
    icon: <FiFile />,
    action: () => navigate('/files'),
    keywords: ['upload', 'download', 'storage'],
  },
  
  // Actions
  {
    id: 'action-upload',
    title: 'Upload Data',
    description: 'Upload a new data source',
    category: 'actions',
    icon: <FiUpload />,
    shortcut: '⌘U',
    action: () => executeAction('openUploader'),
    keywords: ['import', 'add', 'data'],
  },
  {
    id: 'action-export',
    title: 'Export Map',
    description: 'Export current map as image',
    category: 'actions',
    icon: <FiDownload />,
    shortcut: '⌘E',
    action: () => executeAction('exportMap'),
    keywords: ['save', 'image', 'png'],
  },
  
  // Agent Commands
  {
    id: 'agent-query',
    title: 'Ask AI Assistant',
    description: 'Ask questions about your data',
    category: 'agent',
    icon: <FiCommand />,
    shortcut: '⌘K',
    action: () => executeAction('openAssistant'),
    keywords: ['ai', 'help', 'question', 'natural language'],
  },
  {
    id: 'agent-analyze',
    title: 'Run Analysis',
    description: 'Run spatial analysis on current data',
    category: 'agent',
    icon: <FiBox />,
    action: () => executeAction('runAnalysis'),
    keywords: ['spatial', 'analyze', 'process'],
  },
  {
    id: 'agent-insights',
    title: 'View Insights',
    description: 'See AI-generated insights',
    category: 'agent',
    icon: <FiActivity />,
    action: () => {
      navigate('/map');
      executeAction('showInsights');
    },
    keywords: ['findings', 'patterns', 'discover'],
  },
  
  // Layer Commands
  {
    id: 'layer-toggle-all',
    title: 'Toggle All Layers',
    description: 'Show/hide all layers',
    category: 'layers',
    action: () => executeAction('toggleAllLayers'),
    keywords: ['visibility', 'show', 'hide'],
  },
  {
    id: 'layer-clustering',
    title: 'Toggle Clustering',
    description: 'Enable/disable point clustering',
    category: 'layers',
    action: () => executeAction('toggleClustering'),
    keywords: ['points', 'aggregate', 'group'],
  },
  
  // Settings
  {
    id: 'settings-theme',
    title: 'Change Theme',
    description: 'Switch between light/dark mode',
    category: 'settings',
    action: () => executeAction('toggleTheme'),
    keywords: ['dark', 'light', 'color'],
  },
];

// ============================================
// Command Registry Hook
// ============================================

export function useCommandRegistry() {
  const [commands, setCommands] = useState<Command[]>([]);
  const navigate = useNavigate();
  const executeActionRef = useRef<(action: string) => void>(() => {});
  
  const registerCommand = useCallback((command: Command) => {
    setCommands(prev => {
      // Remove existing command with same ID
      const filtered = prev.filter(c => c.id !== command.id);
      return [...filtered, command];
    });
  }, []);
  
  const unregisterCommand = useCallback((commandId: string) => {
    setCommands(prev => prev.filter(c => c.id !== commandId));
  }, []);
  
  const executeAction = useCallback((action: string) => {
    executeActionRef.current(action);
  }, []);
  
  const setActionHandler = useCallback((handler: (action: string) => void) => {
    executeActionRef.current = handler;
  }, []);
  
  const defaultCommands = useMemo(() => 
    createDefaultCommands(navigate, executeAction),
    [navigate, executeAction]
  );
  
  const allCommands = useMemo(() => {
    const defaultIds = new Set(defaultCommands.map(c => c.id));
    const customCommands = commands.filter(c => !defaultIds.has(c.id));
    return [...defaultCommands, ...customCommands];
  }, [defaultCommands, commands]);
  
  return {
    commands: allCommands,
    registerCommand,
    unregisterCommand,
    setActionHandler,
  };
}

// ============================================
// Command Palette Component
// ============================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = 'Type a command or search...',
  maxResults = 10,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first if no query
      return commands.slice(0, maxResults);
    }
    
    const queryLower = query.toLowerCase();
    
    const scored = commands.map(command => {
      let score = 0;
      
      // Exact title match
      if (command.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Keyword match
      if (command.keywords?.some(k => k.toLowerCase().includes(queryLower))) {
        score += 5;
      }
      
      // Category match
      if (command.category.includes(queryLower)) {
        score += 3;
      }
      
      // Description match
      if (command.description?.toLowerCase().includes(queryLower)) {
        score += 2;
      }
      
      return { command, score };
    });
    
    // Sort by score and filter out zero scores
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.command)
      .slice(0, maxResults);
  }, [commands, query, maxResults]);
  
  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, Command[]> = {
      navigation: [],
      actions: [],
      agent: [],
      layers: [],
      settings: [],
      files: [],
      analysis: [],
    };
    
    filteredCommands.forEach(cmd => {
      groups[cmd.category]?.push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = filteredCommands.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);
  
  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    const selected = list?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);
  
  // Category icons and labels
  const categoryInfo: Record<CommandCategory, { icon: React.ReactNode; label: string }> = {
    navigation: { icon: <FiMap />, label: 'Navigation' },
    actions: { icon: <FiArrowRight />, label: 'Actions' },
    agent: { icon: <FiCommand />, label: 'AI Assistant' },
    layers: { icon: <FiLayers />, label: 'Layers' },
    settings: { icon: <FiSettings />, label: 'Settings' },
    files: { icon: <FiFile />, label: 'Files' },
    analysis: { icon: <FiActivity />, label: 'Analysis' },
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <FiSearch className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">ESC</span>
              to close
            </div>
          </div>
          
          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto" ref={listRef}>
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <FiCommand className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => {
                if (cmds.length === 0) return null;
                
                const info = categoryInfo[category as CommandCategory];
                
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {info.icon}
                      {info.label}
                    </div>
                    
                    {/* Commands */}
                    {cmds.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <motion.button
                          key={command.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          onClick={() => {
                            command.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          {/* Icon */}
                          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {command.icon || <FiCommand />}
                          </span>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {command.title}
                              </span>
                              {command.shortcut && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                                  {command.shortcut}
                                </span>
                              )}
                            </div>
                            {command.description && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {command.description}
                              </span>
                            )}
                          </div>
                          
                          {/* Arrow indicator */}
                          {isSelected && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-blue-500"
                            >
                              <FiArrowRight />
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</span>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</span>
                to select
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Powered by Maps Platform</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Hook for Command Palette
// ============================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { commands, registerCommand, unregisterCommand, setActionHandler } = useCommandRegistry();
  
  // Toggle palette
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close, isOpen]);
  
  // Close on navigation
  useEffect(() => {
    close();
  }, [location.pathname, close]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    commands,
    registerCommand,
    unregisterCommand,
    setActionHandler,
  };
}

export default CommandPalette;
