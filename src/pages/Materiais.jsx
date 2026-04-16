import { useState, useEffect } from 'react';
import { getMateriaPrima, deleteMateriaPrima } from '../services/api';
import MaterialForm from '../components/MaterialForm';
import QRModal from '../components/QRModal';
import StockModal from '../components/StockModal';
import { useToast } from '../components/Toast';

function stockStatus(qtd, min) {
  if (qtd <= 0)    return { label: 'Esgotado',   cls: 'badge-critical' };
  if (qtd <= min)  return { label: 'Stock Baixo', cls: 'badge-low' };
  return { label: 'OK', cls: 'badge-ok' };
}
function fmt(n) { return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 2 }); }

export default function Materiais() {
  const toast = useToast();
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [qrId, setQrId]         = useState(null);
  const [stockMat, setStockMat] = useState(null); // material para o modal de stock
  const [search, setSearch]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const load = () => {
    setLoading(true);
    getMateriaPrima()
      .then(setList)
      .catch(() => toast('Erro ao carregar', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (m) => {
    if (!confirm(`Eliminar "${m.descricao}"?\nTodos os movimentos associados serão eliminados.`)) return;
    try {
      await deleteMateriaPrima(m.id);
      toast('Eliminado com sucesso', 'success');
      load();
    } catch {
      toast('Erro ao eliminar', 'error');
    }
  };

  const handleStockSaved = (res) => {
    // Atualiza o material na lista localmente sem recarregar tudo
    setList(prev =>
      prev.map(m =>
        m.id === res.movimento.materia_prima_id
          ? { ...m, quantidade: res.quantidade_nova }
          : m
      )
    );
    setStockMat(prev => prev ? { ...prev, quantidade: res.quantidade_nova } : null);
  };

  const filtered = list.filter(m => {
    const matchSearch = m.descricao.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filtroEstado === 'baixo')    return Number(m.quantidade) > 0 && Number(m.quantidade) <= Number(m.estoque_minimo);
    if (filtroEstado === 'esgotado') return Number(m.quantidade) <= 0;
    if (filtroEstado === 'ok')       return Number(m.quantidade) > Number(m.estoque_minimo);
    return true;
  });

  const counts = {
    todos:    list.length,
    ok:       list.filter(m => Number(m.quantidade) > Number(m.estoque_minimo)).length,
    baixo:    list.filter(m => Number(m.quantidade) > 0 && Number(m.quantidade) <= Number(m.estoque_minimo)).length,
    esgotado: list.filter(m => Number(m.quantidade) <= 0).length,
  };

  return (
    <div>
      <div className="page-header">
        <h1>Matérias-Primas</h1>
        <p>Gestão do catálogo e controlo de stock</p>
      </div>

      <div className="card">
        <div className="card-body">

          {/* Toolbar */}
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
            <input
              className="form-input"
              style={{ maxWidth: 260 }}
              placeholder="Pesquisar por descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {/* Filtros de estado */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'todos',    label: `Todos (${counts.todos})` },
                { key: 'ok',       label: `OK (${counts.ok})` },
                { key: 'baixo',    label: `Baixo (${counts.baixo})` },
                { key: 'esgotado', label: `Esgotado (${counts.esgotado})` },
              ].map(f => (
                <button
                  key={f.key}
                  className={`btn btn-sm ${filtroEstado === f.key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFiltroEstado(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
              onClick={() => { setEditing(null); setShowForm(true); }}>
              + Nova Matéria-Prima
            </button>
          </div>

          {loading && <div className="loading">A carregar...</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 40 }}>📦</div>
              <p>Nenhuma matéria-prima encontrada</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descrição</th>
                    <th>L × C × E (mm)</th>
                    <th style={{ textAlign: 'right' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Mín.</th>
                    <th style={{ textAlign: 'right' }}>Máx.</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const s = stockStatus(m.quantidade, m.estoque_minimo);
                    return (
                      <tr key={m.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{m.id}</td>
                        <td style={{ fontWeight: 500 }}>{m.descricao}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {fmt(m.largura)} × {fmt(m.comprimento)} × {fmt(m.espessura)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700,
                          color: m.quantidade <= 0 ? 'var(--danger)' : m.quantidade <= m.estoque_minimo ? 'var(--warning)' : 'inherit'
                        }}>
                          {fmt(m.quantidade)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(m.estoque_minimo)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {m.estoque_maximo != null ? fmt(m.estoque_maximo) : '—'}
                        </td>
                        <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            {/* Botão de movimento de stock */}
                            <button
                              className="btn btn-success btn-sm"
                              title="Adicionar / Reduzir Stock"
                              onClick={() => setStockMat(m)}
                            >
                              ±
                            </button>
                            <button className="btn btn-ghost btn-sm" title="QR Code"
                              onClick={() => setQrId(m.id)}>QR</button>
                            <button className="btn btn-ghost btn-sm" title="Editar"
                              onClick={() => { setEditing(m); setShowForm(true); }}>✏️</button>
                            <button className="btn btn-danger btn-sm" title="Eliminar"
                              onClick={() => handleDelete(m)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <MaterialForm
          material={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {qrId && <QRModal materialId={qrId} onClose={() => setQrId(null)} />}

      {stockMat && (
        <StockModal
          material={stockMat}
          onClose={() => setStockMat(null)}
          onSaved={(res) => { handleStockSaved(res); }}
        />
      )}
    </div>
  );
}
