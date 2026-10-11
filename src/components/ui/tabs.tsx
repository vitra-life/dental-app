import type { ReactNode } from 'react';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Shrinks the bar to its tabs instead of filling the row. */
  fit?: boolean;
}

/** A segmented tab bar: pills on a soft track. */
export function Tabs<K extends string>({ tabs, active, onChange, fit = false }: TabsProps<K>) {
  return (
    <div className={`flex gap-1 bg-surface-100 p-1 rounded-xl overflow-x-auto no-scrollbar ${fit ? 'w-fit max-w-full' : ''}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`${fit ? 'px-4' : 'flex-1 px-3'} min-w-max inline-flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
            active === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-600 hover:text-surface-800'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
