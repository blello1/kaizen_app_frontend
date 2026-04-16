import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">📦 Gestão de Stocks</span>
      <div className="navbar-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/materiais">Matérias-Primas</NavLink>
        <NavLink to="/scanner">Leitor QR</NavLink>
        <NavLink to="/movimentos">Movimentos</NavLink>
      </div>
    </nav>
  );
}
