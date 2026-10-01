import type { ReactNode } from 'react';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon: ReactNode;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Lets the tab row scroll sideways on narrow screens. */
  scrollable?: boolean;
}

/** An underlined tab bar. */
export function Tabs<K extends string>({ tabs, active, onChange, scrollable = true }: TabsProps<K>) {
  return (
    <div className={`flex items-center gap-1 border-b border-surface-100${scrollable ? ' overflow-x-auto no-scrollbar' : ''}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${scrollable ? 'whitespace-nowrap ' : ''}${
            active === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-400 hover:text-surface-600'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
