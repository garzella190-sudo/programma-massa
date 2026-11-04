'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  id?: string | number;
  label?: string;
  isDivider?: boolean;
  isDeletable?: boolean;
  onDelete?: (id: string | number) => void;
  [key: string]: any;
}

interface SelectProps {
  options: (SelectOption | string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  icon?: React.ElementType;
  className?: string;
  searchable?: boolean;
  variant?: 'default' | 'minimal';
}

const Select = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleziona...", 
  icon: Icon, 
  className,
  searchable = false,
  variant = 'default'
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = React.useMemo(() => options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') return { id: opt, label: opt.toString() };
    const label = opt.label || opt.nome || opt.text || opt.id?.toString();
    return { ...opt, label };
  }), [options]);

  const selectedOption = normalizedOptions.find(opt => 
    (opt.id !== undefined && String(opt.id) === String(value)) || 
    (opt.label !== undefined && String(opt.label) === String(value))
  );

  const filteredOptions = React.useMemo(() => {
    if (!searchable || query.trim() === '') return normalizedOptions;
    return normalizedOptions.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase()));
  }, [searchable, query, normalizedOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Piccolo ritardo per assicurarsi che il DOM sia aggiornato e la tastiera mobile non faccia interferenza
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // Centra l'elemento nella vista per massima visibilità
        });
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full transition-colors outline-none flex items-center h-11 text-[15px] font-semibold rounded-[10px]",
          variant === 'default'
            ? "bg-field border border-transparent px-3"
            : "bg-transparent px-1",
          isOpen && variant === 'default' ? "border-accent" : "",
          selectedOption ? "text-ink" : "text-ink-3"
        )}
      >
      {Icon && <Icon size={16} className="absolute left-3 text-ink-3 shrink-0" />}
      <span className={cn("flex-1 truncate leading-none", Icon ? "pl-6 text-left" : variant === 'minimal' ? "text-center" : "text-left")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-[200] top-full mt-2 bg-card border border-line rounded-[12px] overflow-hidden animate-fade-in shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
          variant === 'minimal' ? "left-1/2 -translate-x-1/2 min-w-[120px] w-max" : "w-full"
        )}>
          {searchable && (
            <div className="p-2 border-b border-line">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-field border-none rounded-[8px] pl-9 pr-4 py-2 text-[15px] font-medium text-ink placeholder:text-ink-3 outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Cerca..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="max-h-[220px] overflow-y-auto p-1.5 no-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center h-caption italic">Nessun risultato</p>
            ) : (
              filteredOptions.map((opt, idx) => {
                if (opt.isDivider) {
                  return <div key={idx} className="h-px bg-line my-1.5 mx-2" />;
                }
                return (
                <div key={idx} className="flex flex-row items-center justify-between w-full group/item">
                  <button
                    type="button"
                    onClick={() => opt.id !== undefined && handleSelect(opt.id)}
                    className={cn(
                      "flex-1 px-3 py-2.5 rounded-[8px] transition-colors flex items-center group",
                      variant === 'minimal' ? "justify-center" : "text-left justify-between",
                      (opt.id !== undefined && String(opt.id) === String(value)) || (opt.label !== undefined && String(opt.label) === String(value))
                        ? "bg-accent/16 text-accent"
                        : "hover:bg-field text-ink"
                    )}
                  >
                    <div className={cn("flex items-center gap-3 min-w-0", variant === 'minimal' && "mx-auto")}>
                      <p className={cn("text-[15px] font-semibold truncate", variant === 'minimal' && "text-center")}>{opt.label}</p>
                    </div>
                    {variant !== 'minimal' && (value === opt.id || (opt.label !== undefined && value === opt.label)) && <Check size={14} className="shrink-0" />}
                  </button>
                  {opt.isDeletable && opt.onDelete && opt.id !== undefined && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); opt.onDelete!(opt.id!); }}
                      className="p-2 ml-1 text-ink-3 hover:text-danger hover:bg-field rounded-[8px] transition-colors"
                      title="Elimina dalla lista"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Select);
