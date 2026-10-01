import { useState, useEffect } from 'react';
import { ArrowRight, Lightbulb, Send, Sparkles, Target, Users, Zap } from 'lucide-react';
import { IconBox } from '@/components/ui/icon-box';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { formatDateShort } from '@/lib/date';
import { formatNumber, formatTime } from '@/lib/format';
import type { PageKey } from '@/lib/types';
import { answerQuestion, isSlotQuestion, loadAssistantData, type AssistantData, type Insight } from './ai-insights';

interface AIAssistantProps {
  onNavigate: (page: PageKey) => void;
}

const insightColors: Record<Insight['color'], { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
  secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' },
  error: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
};

const quickQuestions = ['اولین نوبت خالی؟', 'درآمدم چطور است؟', 'چند بیمار غیرفعال دارم؟', 'بهترین پیشنهاد شما؟'];

/** Pause before showing an answer, so it reads as the assistant working. */
const ANSWER_DELAY_MS = 600;

export function AIAssistant({ onNavigate }: AIAssistantProps) {
  const [data, setData] = useState<AssistantData | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setData(loadAssistantData());
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonList count={4} className="h-32" />
        </div>
      </div>
    );
  }

  const { insights, segments, freeSlots } = data;

  function handleAsk() {
    if (!data || !question.trim()) return;
    const response = answerQuestion(question, data);
    if (isSlotQuestion(question)) {
      setAnswer(response);
      return;
    }
    setAsking(true);
    setAnswer(null);
    setTimeout(() => {
      setAnswer(response);
      setAsking(false);
    }, ANSWER_DELAY_MS);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-500 rounded-2xl p-6 lg:p-8 shadow-elevated">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-white/80" />
            <span className="text-white/80 text-sm font-medium">دستیار هوشمند</span>
          </div>
          <h2 className="text-white text-xl lg:text-2xl font-bold mb-2">تحلیل و پیشنهادهای هوشمند</h2>
          <p className="text-white/70 text-sm mb-4">سوال خود را از من بپرسید تا وضعیت کلینیک را تحلیل کنم</p>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="مثلا: اولین نوبت خالی کی است؟ یا درآمدم چطور است؟"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/50 px-2"
            />
            <button onClick={handleAsk} disabled={asking} className="p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <Send size={18} className="text-white" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {quickQuestions.map((chip) => (
              <button
                key={chip}
                onClick={() => setQuestion(chip)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-xs rounded-lg transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-4 p-4 bg-white/15 backdrop-blur-sm rounded-xl animate-slide-up">
              <div className="flex items-start gap-2">
                <Lightbulb size={18} className="text-white/80 shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm whitespace-pre-line">{answer}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next free slots */}
      {freeSlots.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IconBox icon={Zap} tone="primary" />
              <div>
                <h3 className="font-bold text-surface-800">نزدیک‌ترین نوبت‌های خالی</h3>
                <p className="text-xs text-surface-400 mt-0.5">۱۰ نوبت خالی بعدی</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              نوبت‌دهی
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {freeSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => onNavigate('appointments')}
                className="p-3 bg-surface-50 hover:bg-primary-50 rounded-xl text-center transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="text-xs text-surface-400 group-hover:text-primary-500">{slot.dayName}</p>
                <p className="font-bold text-surface-700 text-sm mt-1 group-hover:text-primary-700">{formatTime(slot.time)}</p>
                <p className="text-[10px] text-surface-400 mt-0.5">{formatDateShort(slot.date)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div>
        <h3 className="font-bold text-surface-800 text-lg mb-4 flex items-center gap-2">
          <Target size={20} className="text-primary-500" />
          پیشنهادهای هوشمند
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const c = insightColors[insight.color];
            const Icon = insight.icon;
            const action = insight.action;
            return (
              <div
                key={insight.id}
                className={`p-5 rounded-2xl border ${c.bg} ${c.border} animate-slide-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 ${c.text}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-surface-800 text-sm">{insight.title}</h4>
                      {insight.value && <span className={`text-xs font-bold ${c.text} whitespace-nowrap`}>{insight.value}</span>}
                    </div>
                    <p className="text-xs text-surface-600 mt-1 leading-relaxed">{insight.description}</p>
                    {action && (
                      <button
                        onClick={() => onNavigate(action.page)}
                        className={`inline-flex items-center gap-1 mt-3 text-xs font-medium ${c.text} hover:opacity-70 transition-opacity`}
                      >
                        {action.label}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient segments */}
      <div className="card p-6">
        <SectionHeader title="سگمنت‌سازی بیماران" subtitle="دسته‌بندی هوشمند بیماران بر اساس رفتار" icon={Users} tone="secondary" className="mb-5" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((seg, i) => (
            <button
              key={i}
              onClick={() => onNavigate('patients')}
              className="p-4 bg-surface-50 hover:bg-surface-100 rounded-xl text-right transition-all animate-slide-up group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-500 truncate">{seg.label}</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(seg.count)} نفر</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
