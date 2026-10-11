import { useState, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { ToastContainer } from '@/components/ui/toast';
import { AIAssistant } from '@/features/ai-assistant/ai-assistant-page';
import { Appointments } from '@/features/appointments/appointments-page';
import { Billing } from '@/features/billing/billing-page';
import { Dashboard } from '@/features/dashboard/dashboard-page';
import { Lab } from '@/features/lab/lab-page';
import { Patients } from '@/features/patients/patients-page';
import { Reports } from '@/features/reports/reports-page';
import { Settings } from '@/features/settings/settings-page';
import { SMSPanel } from '@/features/sms/sms-panel-page';
import type { PageKey } from '@/lib/types';

function App() {
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

  const renderPage = () => {
    switch (currentPage) {
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
      <Layout currentPage={currentPage} onNavigate={navigate}>
        {renderPage()}
      </Layout>
      <ToastContainer />
    </>
  );
}

export default App;
