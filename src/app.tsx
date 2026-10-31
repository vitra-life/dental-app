import { useState, useCallback } from 'react';
import { ShieldOff } from 'lucide-react';
import { Layout } from '@/components/layout';
import { EmptyState } from '@/components/ui/empty-state';
import { ToastContainer } from '@/components/ui/toast';
import { usePermissions } from '@/data/session';
import { AuthGate } from '@/features/auth/auth-gate';
import { AIAssistant } from '@/features/ai-assistant/ai-assistant-page';
import { Appointments } from '@/features/appointments/appointments-page';
import { Billing } from '@/features/billing/billing-page';
import { Dashboard } from '@/features/dashboard/dashboard-page';
import { Lab } from '@/features/lab/lab-page';
import { Patients } from '@/features/patients/patients-page';
import { Reports } from '@/features/reports/reports-page';
import { Settings } from '@/features/settings/settings-page';
import { SMSPanel } from '@/features/sms/sms-panel-page';
import { PAGE_PERMISSION } from '@/lib/permissions';
import type { PageKey } from '@/lib/types';

/** The order pages are tried in when the current one is not allowed. */
const PAGE_ORDER: PageKey[] = ['dashboard', 'appointments', 'patients', 'billing', 'lab', 'reports', 'sms', 'ai', 'settings'];

/** The signed-in app: the pages the user's permissions allow. */
function ClinicApp() {
  const { can } = usePermissions();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  /** A patient record to open when the patients page is shown. */
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  /** Counts navigations, so a page starts fresh each time it is opened, even from itself. */
  const [visit, setVisit] = useState(0);

  const navigate = useCallback((page: PageKey) => {
    setSelectedPatientId(null);
    setCurrentPage(page);
    setVisit((v) => v + 1);
  }, []);

  const openPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patients');
    setVisit((v) => v + 1);
  }, []);

  // A page the user may not open falls back to the first one they may.
  const page = can(PAGE_PERMISSION[currentPage]) ? currentPage : PAGE_ORDER.find((p) => can(PAGE_PERMISSION[p]));

  const renderPage = () => {
    switch (page) {
      case undefined:
        return <EmptyState icon={ShieldOff} title="دسترسی ندارید" description="نقش شما در این کلینیک به هیچ صفحه‌ای دسترسی ندارد. با مدیر کلینیک تماس بگیرید." />;
      case 'patients':
        return <Patients key={visit} selectedPatientId={selectedPatientId} onNavigate={navigate} />;
      case 'appointments':
        return <Appointments onOpenPatient={openPatient} />;
      case 'billing':
        return <Billing onOpenPatient={openPatient} />;
      case 'lab':
        return <Lab onOpenPatient={openPatient} />;
      case 'reports':
        return <Reports />;
      case 'ai':
        return <AIAssistant onNavigate={navigate} />;
      case 'sms':
        return <SMSPanel />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={navigate} onOpenPatient={openPatient} />;
    }
  };

  return (
    <>
      <Layout currentPage={page ?? currentPage} onNavigate={navigate}>
        {renderPage()}
      </Layout>
    </>
  );
}

function App() {
  return (
    <>
      <AuthGate>
        <ClinicApp />
      </AuthGate>
      <ToastContainer />
    </>
  );
}

export default App;
