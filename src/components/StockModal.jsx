import { useState } from 'react';
import { createMovimento } from '../services/api';
import { useToast } from './Toast';

function fmt(n) { return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 2 }); }

export default function StockModal({ material, onClose, onSaved }) {
  const toast = useToast();
  const [querReduzir, setQuerReduzir] = useState(false);
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);

  const qtdAtual = Number(material.quantidade);
  const min = Number(material.estoque_minimo);
  const max = material.estoque_maximo ? Number(material.estoque_maximo) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtd = parseFloat(quantidade);
    if (!qtd || qtd <= 0) { toast('Quantidade inválida', 'error'); return; }

    setLoading(true);
    try {
      const res = await createMovimento({
        materia_prima_id: material.id,
        quer_reduzir: querReduzir,
        quantidade: qtd,
      });
      toast(
        `${querReduzir ? 'Saída' : 'Entrada'} de ${fmt(qtd)} registada! Novo stock: ${fmt(res.quantidade_nova)}`,
        'success'
      );
      onSaved(res);
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao registar movimento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const novaQtd = quantidade
    ? (querReduzir ? qtdAtual - parseFloat(quantidade) : qtdAtual + parseFloat(quantidade))
    : null;

  const novaQtdValida = novaQtd !== null && novaQtd >= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Movimento de Stock</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Info do material */}
            <div className="scan-info-box" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 8 }}>{material.descricao}</h3>
              <div className="scan-info-row">
                <span>Dimensões</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {fmt(material.largura)} × {fmt(material.comprimento)} × {fmt(material.espessura)} mm
                </span>
              </div>
              <div className="scan-info-row">
                <span>Stock atual</span>
                <strong style={{ fontSize: 16 }}>{fmt(qtdAtual)}</strong>
              </div>
              <div className="scan-info-row">
                <span>Mínimo / Máximo</span>
                <span>{fmt(min)} / {max != null ? fmt(max) : '—'}</span>
              </div>
            </div>

            {/* Toggle Entrada / Saída */}
            <div className="scan-toggle" style={{ marginBottom: 16 }}>
              <button type="button"
                className={!querReduzir ? 'active-in' : ''}
                onClick={() => setQuerReduzir(false)}>
                ➕ Entrada (adicionar)
              </button>
              <button type="button"
                className={querReduzir ? 'active-out' : ''}
                onClick={() => setQuerReduzir(true)}>
                ➖ Saída (retirar)
              </button>
            </div>

            {/* Quantidade */}
            <div className="form-group">
              <label className="form-label">Quantidade</label>
              <input
                type="number" step="0.01" min="0.01"
                className="form-input"
                style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>

            {/* Preview do novo stock */}
            {quantidade !== '' && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                background: novaQtdValida ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${novaQtdValida ? '#86efac' : '#fecaca'}`,
                color: novaQtdValida ? '#15803d' : 'var(--danger)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Stock após movimento</span>
                <strong style={{ fontSize: 15 }}>
                  {novaQtdValida ? fmt(novaQtd) : '⚠️ Stock insuficiente'}
                </strong>
              </div>
            )}

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className={`btn ${querReduzir ? 'btn-danger' : 'btn-success'}`}
              disabled={loading || (novaQtd !== null && !novaQtdValida)}
            >
              {loading ? 'A registar...' : (querReduzir ? '➖ Confirmar Saída' : '➕ Confirmar Entrada')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
