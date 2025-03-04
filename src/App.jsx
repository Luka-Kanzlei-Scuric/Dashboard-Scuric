// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import PrivatinsolvenzFormular from './components/PrivatinsolvenzFormular';
import Dashboard from './components/layout/Dashboard';
import SachbearbeitungDashboard from './components/layout/SachbearbeitungDashboard';
import ClientsList from './components/ClientsList';
import ChecklistePhase from './components/ChecklistePhase';
import DokumentePhase from './components/DokumentePhase';
import ClickUpImport from './components/ClickUpImport';

// Welcome/Home page with team selection
const TeamSelection = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <img 
      src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
      alt="Scuric Rechtsanwälte" 
      className="h-auto w-64 object-contain mb-8" 
    />
    
    <h1 className="text-2xl font-bold mb-6 text-gray-800">Insolvenzmanagement-System</h1>
    <p className="mb-8 text-gray-600 text-center max-w-md">Bitte wählen Sie Ihren Arbeitsbereich aus, um auf das entsprechende Dashboard zuzugreifen.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
      <a 
        href="/verkauf" 
        className="flex flex-col items-center p-8 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
      >
        <div className="w-20 h-20 rounded-full bg-[#f5e6e6] text-[#9c1b1c] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[#9c1b1c]">Verkaufsteam</h2>
        <p className="text-gray-600 text-center">Erstberatung und Checklisten für neue Mandanten</p>
      </a>
      
      <a 
        href="/sachbearbeitung" 
        className="flex flex-col items-center p-8 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
      >
        <div className="w-20 h-20 rounded-full bg-[#f5e6e6] text-[#9c1b1c] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[#9c1b1c]">Sachbearbeitungsteam</h2>
        <p className="text-gray-600 text-center">Dokumentenverwaltung und Prozessbearbeitung</p>
      </a>
    </div>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Home route with team selection */}
        <Route path="/" element={<TeamSelection />} />

        {/* Legacy route for backward compatibility */}
        <Route path="/form/:taskId" element={<PrivatinsolvenzFormular />} />

        {/* VERKAUFSTEAM ROUTES */}
        {/* Verkaufsteam Dashboard */}
        <Route path="/verkauf" element={
          <Dashboard>
            <ClientsList teamMode="verkauf" />
          </Dashboard>
        } />

        {/* Erstberatung */}
        <Route path="/verkauf/erstberatung" element={
          <Dashboard>
            <ClientsList teamMode="verkauf" phase="erstberatung" />
          </Dashboard>
        } />
        <Route path="/verkauf/erstberatung/:taskId" element={
          <Dashboard>
            <PrivatinsolvenzFormular />
          </Dashboard>
        } />

        {/* Checkliste */}
        <Route path="/verkauf/checkliste" element={
          <Dashboard>
            <ClientsList teamMode="verkauf" phase="checkliste" />
          </Dashboard>
        } />
        <Route path="/verkauf/checkliste/:taskId" element={
          <Dashboard>
            <ChecklistePhase />
          </Dashboard>
        } />
        
        {/* ClickUp Integration */}
        <Route path="/verkauf/clickup-import" element={
          <Dashboard>
            <ClickUpImport />
          </Dashboard>
        } />

        {/* SACHBEARBEITUNGSTEAM ROUTES */}
        {/* Sachbearbeitungsteam Dashboard */}
        <Route path="/sachbearbeitung" element={
          <SachbearbeitungDashboard>
            <ClientsList teamMode="sachbearbeitung" />
          </SachbearbeitungDashboard>
        } />

        {/* Dokumente */}
        <Route path="/sachbearbeitung/dokumente" element={
          <SachbearbeitungDashboard>
            <ClientsList teamMode="sachbearbeitung" phase="dokumente" />
          </SachbearbeitungDashboard>
        } />
        <Route path="/sachbearbeitung/dokumente/:taskId" element={
          <SachbearbeitungDashboard>
            <DokumentePhase />
          </SachbearbeitungDashboard>
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;