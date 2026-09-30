import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Patients } from '@/pages/Patients';
import { Appointments } from '@/pages/Appointments';
import { Billing } from '@/pages/Billing';
import { Lab } from '@/pages/Lab';
import { Reports } from '@/pages/Reports';
import { AIAssistant } from '@/pages/AIAssistant';
import { Settings } from '@/pages/Settings';
import { SMSPanel } from '@/pages/SMSPanel';
import { ToastContainer } from '@/components/ui/Toast';
import type { PageKey } from '@/lib/types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const navigate = useCallback((page: PageKey) => {
    setCurrentPage(page);
  }, []);

  const openPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patients');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} onOpenPatient={openPatient} />;
      case 'patients':
        return <Patients selectedPatientId={selectedPatientId} onNavigate={navigate} />;
      case 'appointments':
        return <Appointments onNavigate={navigate} onOpenPatient={openPatient} />;
      case 'billing':
        return <Billing onNavigate={navigate} onOpenPatient={openPatient} />;
      case 'lab':
        return <Lab onNavigate={navigate} onOpenPatient={openPatient} />;
      case 'reports':
        return <Reports />;
      case 'ai':
        return <AIAssistant onNavigate={navigate} onOpenPatient={openPatient} />;
      case 'sms':
        return <SMSPanel onNavigate={navigate} />;
      case 'settings':
        return <Settings />;
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
