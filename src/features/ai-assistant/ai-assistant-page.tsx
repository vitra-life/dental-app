import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, FlaskConical, Send, Sparkles, Wallet } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/lib/date';
import { formatCurrency, formatNumber, formatTime } from '@/lib/format';
import type { PageKey } from '@/lib/types';
import { LoadError } from '@/components/ui/load-error';
import { useClinicData } from '@/data/clinic-data';
import { answerQuestion, loadAssistantData, type Insight } from './ai-insights';

interface AIAssistantProps {
  onNavigate: (page: PageKey) => void;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** Questions offered under an assistant message. */
  suggestions?: string[];
}

const insightColors: Record<Insight['color'], { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  secondary: { bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  error: { bg: 'bg-error-50', text: 'text-error-700', border: 'border-error-200' },
};

const suggestions = [
  'اولین نوبت خالی کی است؟',
  'درآمدم چطور است؟',
  'چند بیمار غیرفعال دارم؟',
  'کدام بیماران بدهی دارند؟',
  'نوبت‌های فردا چطور است؟',
  'درمان‌های ناتمام؟',
  'تعداد بیماران فعال؟',
  'بهترین پیشنهاد شما؟',
];

const GREETING = 'سلام! من دستیار هوشمند ویترا لایف هستم.\n\nمی‌توانم به سؤالات شما درباره وضعیت مالی، بیماران، نوبت‌ها و عملکرد کلینیک پاسخ دهم.';

/** Pause before showing an answer, so it reads as the assistant working. */
const ANSWER_DELAY_MS = 600;

function AssistantAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl bg-linear-to-br/srgb from-violet-500 to-primary-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
      <Sparkles size={16} className="text-white" />
    </div>
  );
}

export function AIAssistant({ onNavigate }: AIAssistantProps) {
  const clinic = useClinicData();
  const data = clinic.data ? loadAssistantData(clinic.data) : null;
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: GREETING, suggestions: suggestions.slice(0, 4) }]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [messages, asking]);

  if (!data && clinic.error) return <LoadError error={clinic.error} onRetry={clinic.refetch} />;

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { insights, segments, freeSlots, summary } = data;

  function send(text: string) {
    const question = text.trim();
    if (!data || !question || asking) return;
    const reply = answerQuestion(question, data);
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: question }]);
    setInput('');
    setAsking(true);
    setTimeout(() => {
      const followUps = suggestions.filter((s) => s !== question).slice(nextId.current % 4, (nextId.current % 4) + 3);
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', text: reply, suggestions: followUps }]);
      setAsking(false);
    }, ANSWER_DELAY_MS);
  }

  const quickStats = [
    { label: 'نوبت امروز', value: formatNumber(summary.todayAppointments), icon: CalendarDays, color: 'text-primary-600' },
    { label: 'طرح فعال', value: formatNumber(summary.activePlans), icon: ClipboardList, color: 'text-violet-600' },
    { label: 'مانده وصولی', value: formatCurrency(summary.pendingAmount), icon: Wallet, color: 'text-warning-600' },
    { label: 'لابراتوار در انتظار', value: formatNumber(summary.openLabOrders), icon: FlaskConical, color: 'text-secondary-600' },
  ];

  return (
    <div className="lg:flex lg:gap-4 lg:h-[calc(100vh-6.5rem)]">
      {/* Conversation */}
      <div className="flex flex-col h-[calc(100vh-5.5rem)] lg:h-full lg:flex-1 min-w-0">
        <div className="shrink-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br/srgb from-violet-500 to-primary-500 flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">دستیار هوشمند</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
                <p className="text-xs text-surface-500">دستیار هوشمند مدیریت مطب</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {quickStats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-surface-100 shadow-card p-3 text-center">
                <Icon size={18} className={`mx-auto ${color}`} />
                <p className="text-sm font-bold text-surface-800 mt-1 truncate">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && <AssistantAvatar />}
              <div className={`max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? '' : 'flex-1'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-line w-fit ${
                    msg.role === 'user' ? 'bg-primary-600 text-white rounded-tl-sm' : 'bg-white border border-surface-100 shadow-card text-surface-700 rounded-tr-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="text-xs border border-primary-200 text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full hover:bg-primary-100 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {asking && (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="bg-white border border-surface-100 shadow-card rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 pt-3 border-t border-surface-200">
          <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {suggestions.slice(4).map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs border border-surface-200 text-surface-600 bg-white px-2.5 py-1 rounded-full hover:bg-surface-100 transition-colors whitespace-nowrap shrink-0">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
              className="input-field rounded-2xl px-4 py-2.5"
              placeholder="سؤال خود را بپرسید..."
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || asking}
              title="ارسال"
              className="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} className="-scale-x-100" />
            </button>
          </div>
        </div>
      </div>

      {/* What the assistant has noticed */}
      <aside className="lg:w-80 xl:w-96 shrink-0 lg:overflow-y-auto space-y-4 mt-6 lg:mt-0">
        <div className="card p-4">
          <SectionHeader title="پیشنهادهای هوشمند" note={`${formatNumber(insights.length)} مورد`} className="mb-3" />
          <div className="space-y-2">
            {insights.map((insight) => {
              const c = insightColors[insight.color];
              const Icon = insight.icon;
              const action = insight.action;
              return (
                <div key={insight.id} className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 ${c.text}`}>
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-surface-800 leading-tight">{insight.title}</p>
                        {insight.value && <span className={`text-xs font-bold whitespace-nowrap ${c.text}`}>{insight.value}</span>}
                      </div>
                      <p className="text-xs text-surface-600 mt-1 leading-5">{insight.description}</p>
                      {action && (
                        <button onClick={() => onNavigate(action.page)} className="inline-flex items-center gap-1 text-xs text-primary-700 hover:underline mt-1 font-medium">
                          {action.label}
                          <ArrowLeft size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {freeSlots.length > 0 && (
          <div className="card p-4">
            <SectionHeader
              title="نزدیک‌ترین نوبت‌های خالی"
              className="mb-3"
              aside={<button onClick={() => onNavigate('appointments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">نوبت‌دهی</button>}
            />
            <div className="grid grid-cols-2 gap-2">
              {freeSlots.map((slot, i) => (
                <button key={i} onClick={() => onNavigate('appointments')} className="p-2 bg-surface-50 hover:bg-primary-50 rounded-xl text-center transition-colors">
                  <p className="text-sm font-bold text-surface-700">{formatTime(slot.time)}</p>
                  <p className="text-[11px] text-surface-400">{slot.dayName} {formatDateShort(slot.date)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4">
          <SectionHeader title="سگمنت‌سازی بیماران" className="mb-3" />
          <div className="space-y-1">
            {segments.map((seg) => (
              <button key={seg.label} onClick={() => onNavigate('patients')} className="w-full flex items-center gap-2 text-xs p-2 rounded-xl hover:bg-surface-50 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-surface-600 flex-1 text-right">{seg.label}</span>
                <span className="font-semibold text-surface-800">{formatNumber(seg.count)} نفر</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
