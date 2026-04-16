import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/api';

/* ── helpers ─────────────────────────────────────────────── */
function fmt(n, dec = 2) {
  return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: dec });
}
function fmtDate(d) {
  return new Date(d).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 28, opacity: .6 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ── Bar Chart (7 dias) ──────────────────────────────────── */
function BarChart({ data }) {
  if (!data?.length) return <div className="loading">Sem dados</div>;
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.entradas), Number(d.saidas))), 1);
  const H = 150;
  return (
    <div>
      <div className="chart-wrap">
        {data.map((d, i) => {
          const ein = Number(d.entradas);
          const eout = Number(d.saidas);
          const hIn  = Math.max((ein  / maxVal) * H, ein  > 0 ? 4 : 0);
          const hOut = Math.max((eout / maxVal) * H, eout > 0 ? 4 : 0);
          const label = new Date(d.dia).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
          return (
            <div key={i} className="chart-col">
              <div className="chart-bars">
                <div className="chart-bar chart-bar-in"  style={{ height: hIn  }} title={`Entradas: ${fmt(ein)}`}  />
                <div className="chart-bar chart-bar-out" style={{ height: hOut }} title={`Saídas: ${fmt(eout)}`} />
              </div>
              <div className="chart-label">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span><i className="legend-dot" style={{ background: 'var(--primary)' }} />Entradas</span>
        <span><i className="legend-dot" style={{ background: 'var(--danger)' }} />Saídas</span>
      </div>
    </div>
  );
}

/* ── Stock Progress Bar ──────────────────────────────────── */
function StockBar({ m }) {
  const qtd = Number(m.quantidade);
  const min = Number(m.estoque_minimo);
  const max = m.estoque_maximo ? Number(m.estoque_maximo) : null;

  const ref = max ?? (min > 0 ? min * 4 : Math.max(qtd * 2, 1));
  const pct = Math.min((qtd / ref) * 100, 100);
  const minPct = min > 0 ? Math.min((min / ref) * 100, 100) : null;

  let fillColor = 'var(--success)';
  if (qtd <= 0)   fillColor = 'var(--danger)';
  else if (qtd <= min) fillColor = 'var(--warning)';

  return (
    <div className="stock-row">
      <div className="stock-row-top">
        <span className="stock-name" title={m.descricao}>{m.descricao}</span>
        <span className="stock-qty" style={{ color: fillColor, fontWeight: 600 }}>
          {fmt(qtd)}{max ? ` / ${fmt(max)}` : ''}
        </span>
      </div>
      <div className="stock-track">
        <div className="stock-fill" style={{ width: `${pct}%`, background: fillColor }} />
        {minPct !== null && (
          <div className="stock-min-mark" style={{ left: `${minPct}%` }} title={`Mínimo: ${fmt(min)}`} />
        )}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    getDashboard()
      .then(setData)
      .catch(() => setError('Não foi possível ligar ao servidor.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">A carregar dashboard...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const { totais, hoje, alertas_stock_baixo, visao_geral, movimentos_7dias, movimentos_recentes } = data;

  const totalHoje = Number(hoje.qtd_entradas) - Number(hoje.qtd_saidas);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do stock em tempo real</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Atualizar</button>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard
          label="Matérias-Primas"
          value={totais.total_materiais}
          sub={`${totais.stock_ok} com stock OK`}
          color="var(--primary)"
          icon="📦"
        />
        <StatCard
          label="Stock Baixo"
          value={totais.stock_baixo}
          sub={totais.esgotados > 0 ? `${totais.esgotados} esgotados` : 'Nenhum esgotado'}
          color={totais.stock_baixo > 0 ? 'var(--warning)' : 'var(--success)'}
          icon="⚠️"
        />
        <StatCard
          label="Movimentos Hoje"
          value={hoje.total_movimentos}
          sub={`${hoje.num_entradas} entradas · ${hoje.num_saidas} saídas`}
          color="var(--primary)"
          icon="🔄"
        />
        <StatCard
          label="Entradas Hoje"
          value={fmt(hoje.qtd_entradas, 0)}
          sub="unidades adicionadas"
          color="var(--success)"
          icon="➕"
        />
        <StatCard
          label="Saídas Hoje"
          value={fmt(hoje.qtd_saidas, 0)}
          sub="unidades retiradas"
          color="var(--danger)"
          icon="➖"
        />
        <StatCard
          label="Saldo Hoje"
          value={(totalHoje >= 0 ? '+' : '') + fmt(totalHoje, 0)}
          sub="entradas − saídas"
          color={totalHoje >= 0 ? 'var(--success)' : 'var(--danger)'}
          icon="⚖️"
        />
      </div>

      {/* ── Gráfico 7 dias ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>📊 Movimentos — Últimos 7 Dias</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/movimentos')}>Ver tudo →</button>
          </div>
          <BarChart data={movimentos_7dias} />
        </div>
      </div>

      {/* ── Stock overview + Alertas ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>

        {/* Stock overview */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="card-title" style={{ margin: 0 }}>📈 Visão Geral do Stock</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/materiais')}>Gerir →</button>
            </div>

            {visao_geral.length === 0
              ? <div className="empty-state"><p>Sem materiais cadastrados</p></div>
              : (
                <div className="stock-list">
                  {visao_geral.map(m => <StockBar key={m.id} m={m} />)}
                </div>
              )
            }

            <div className="chart-legend" style={{ marginTop: 12 }}>
              <span><i className="legend-dot" style={{ background: 'var(--success)' }} />OK</span>
              <span><i className="legend-dot" style={{ background: 'var(--warning)' }} />Baixo</span>
              <span><i className="legend-dot" style={{ background: 'var(--danger)' }} />Esgotado</span>
              <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)' }}>| linha = mínimo</span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="card-title" style={{ margin: 0 }}>🚨 Alertas de Stock</div>
              {alertas_stock_baixo.length > 0 && (
                <span className="badge badge-critical">{alertas_stock_baixo.length} alertas</span>
              )}
            </div>

            {alertas_stock_baixo.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36 }}>✅</div>
                <p style={{ marginTop: 8, color: 'var(--success)', fontWeight: 500 }}>Todos os stocks OK</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th style={{ textAlign: 'right' }}>Atual</th>
                      <th style={{ textAlign: 'right' }}>Mínimo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas_stock_baixo.map(m => (
                      <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/materiais')}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{m.descricao}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {fmt(m.largura)}×{fmt(m.comprimento)}×{fmt(m.espessura)} mm
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: m.quantidade <= 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {fmt(m.quantidade)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(m.estoque_minimo)}</td>
                        <td>
                          {m.quantidade <= 0
                            ? <span className="badge badge-critical">Esgotado</span>
                            : <span className="badge badge-low">Baixo</span>
                          }
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

      {/* ── Últimos movimentos ── */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>🕓 Últimos Movimentos</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/movimentos')}>Ver histórico →</button>
          </div>

          {movimentos_recentes.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 36 }}>📋</div>
              <p>Sem movimentos registados</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Material</th>
                    <th>Dimensões</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'right' }}>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentos_recentes.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {fmtDate(m.data)}
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.descricao}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmt(m.largura)}×{fmt(m.comprimento)}×{fmt(m.espessura)}
                      </td>
                      <td>
                        {m.quer_reduzir
                          ? <span className="badge badge-out">Saída</span>
                          : <span className="badge badge-in">Entrada</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
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
