import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Materiais from './pages/Materiais';
import Scanner from './pages/Scanner';
import Movimentos from './pages/Movimentos';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materiais" element={<Materiais />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/movimentos" element={<Movimentos />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
