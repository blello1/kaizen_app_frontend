import { useState, useEffect } from 'react';
import { getStocks } from '../services/api';

function fmt(n) { return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 2 }); }
function fmtDate(d) {
  return new Date(d).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function Movimentos() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // todos | entrada | saida

  useEffect(() => {
    getStocks()
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(m => {
    if (filter === 'entrada') return !m.quer_reduzir;
    if (filter === 'saida')   return  m.quer_reduzir;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Movimentos de Stock</h1>
        <p>Histórico de todas as entradas e saídas</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div style={{ display: 'flex', gap: 8 }}>
              {['todos', 'entrada', 'saida'].map(f => (
                <button
                  key={f}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {filtered.length} registos
            </span>
          </div>

          {loading && <div className="loading">A carregar...</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 40 }}>📋</div>
              <p>Sem movimentos registados</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data / Hora</th>
                    <th>Material</th>
                    <th>Dimensões (mm)</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.id}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.data)}</td>
                      <td style={{ fontWeight: 500 }}>{m.descricao}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {fmt(m.largura)} × {fmt(m.comprimento)} × {fmt(m.espessura)}
                      </td>
                      <td>
                        {m.quer_reduzir
                          ? <span className="badge badge-out">Saída</span>
                          : <span className="badge badge-in">Entrada</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ color: m.quer_reduzir ? 'var(--danger)' : 'var(--success)' }}>
                          {m.quer_reduzir ? '−' : '+'}{fmt(m.quantidade)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
