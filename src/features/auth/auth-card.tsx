import logo from '@/assets/vitra-life-logo.svg';

/** The centred card shared by the sign-in screens. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="" className="w-12 h-12 mb-3" />
          <p className="text-sm font-bold text-surface-800">ویترا لایف</p>
          <h1 className="text-lg font-bold text-surface-800 mt-4">{title}</h1>
          {subtitle && <p className="text-sm text-surface-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
