import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getMateriaPrimaById, createMovimento } from '../services/api';
import { useToast } from '../components/Toast';

function fmt(n) { return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 2 }); }

export default function Scanner() {
  const toast = useToast();
  const scannerRef = useRef(null);
  const [material, setMaterial] = useState(null);
  const [querReduzir, setQuerReduzir] = useState(false);
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      async (text) => {
        scanner.clear().catch(() => {});
        setScanning(false);
        await handleScan(text);
      },
      () => {} // erros de frame são normais
    );

    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  }, [scanning]);

  const handleScan = async (text) => {
    try {
      let id;
      try {
        const parsed = JSON.parse(text);
        id = parsed.id;
      } catch {
        id = parseInt(text, 10);
      }

      if (!id || isNaN(id)) {
        toast('QR Code inválido — não corresponde a uma matéria-prima', 'error');
        setScanning(true);
        return;
      }

      const mat = await getMateriaPrimaById(id);
      setMaterial(mat);
      setQuantidade('');
      setResultado(null);
    } catch {
      toast('Matéria-prima não encontrada', 'error');
      setScanning(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantidade || parseFloat(quantidade) <= 0) {
      toast('Introduza uma quantidade válida', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await createMovimento({
        materia_prima_id: material.id,
        quer_reduzir: querReduzir,
        quantidade: parseFloat(quantidade),
      });
      setResultado(res);
      setMaterial(prev => ({ ...prev, quantidade: res.quantidade_nova }));
      toast(
        `${querReduzir ? 'Saída' : 'Entrada'} registada! Stock atual: ${fmt(res.quantidade_nova)}`,
        'success'
      );
      setQuantidade('');
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao registar movimento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaScan = () => {
    setMaterial(null);
    setResultado(null);
    setQuantidade('');
    setScanning(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Leitor QR Code</h1>
        <p>Leia o QR Code de uma matéria-prima para registar entrada ou saída</p>
      </div>

      <div className="scanner-card">
        {scanning && (
          <div className="card">
            <div className="card-body">
              <div className="card-title">📷 Aponte a câmara para o QR Code</div>
              <div id="qr-reader" />
            </div>
          </div>
        )}

        {!scanning && material && (
          <div className="card scanner-result">
            <div className="card-body">
              <div className="scan-info-box">
                <h3>{material.descricao}</h3>
                <div className="scan-info-row">
                  <span>Dimensões</span>
                  <span>{fmt(material.largura)} × {fmt(material.comprimento)} × {fmt(material.espessura)} mm</span>
                </div>
                <div className="scan-info-row">
                  <span>Stock atual</span>
                  <strong>{fmt(material.quantidade)}</strong>
                </div>
                <div className="scan-info-row">
                  <span>Stock mínimo</span>
                  <span>{fmt(material.estoque_minimo)}</span>
                </div>
                {material.estoque_maximo != null && (
                  <div className="scan-info-row">
                    <span>Stock máximo</span>
                    <span>{fmt(material.estoque_maximo)}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="scan-toggle">
                  <button
                    type="button"
                    className={!querReduzir ? 'active-in' : ''}
                    onClick={() => setQuerReduzir(false)}
                  >
                    ➕ Entrada (adicionar)
                  </button>
                  <button
                    type="button"
                    className={querReduzir ? 'active-out' : ''}
                    onClick={() => setQuerReduzir(true)}
                  >
                    ➖ Saída (reduzir)
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    placeholder="Introduza a quantidade..."
                    autoFocus
                  />
                </div>

                {resultado && (
                  <div className="alert alert-warning" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }}>
                    ✅ Movimento registado! Novo stock: <strong>{fmt(resultado.quantidade_nova)}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'A registar...' : 'Confirmar'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={handleNovaScan}>
                    Nova Leitura
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
