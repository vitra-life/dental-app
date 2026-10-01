import type { LucideIcon } from 'lucide-react';
import { tones, type Tone } from './tones';

interface IconBoxProps {
  icon: LucideIcon;
  tone: Tone;
  /** Icon size in pixels. */
  size?: number;
}

/** A 40px rounded square with a tinted background and a matching icon. */
export function IconBox({ icon: Icon, tone, size = 20 }: IconBoxProps) {
  return (
    <div className={`w-10 h-10 rounded-xl ${tones[tone].bg} flex items-center justify-center`}>
      <Icon size={size} className={tones[tone].icon} />
    </div>
  );
}
