import { useState, useEffect } from 'react';
import { getQRCode } from '../services/api';

export default function QRModal({ materialId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQRCode(materialId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [materialId]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR Code</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;padding:40px;font-family:sans-serif">
        <h2>${data.material.descricao}</h2>
        <p style="color:#666">${data.material.largura} × ${data.material.comprimento} × ${data.material.espessura} mm</p>
        <img src="${data.qr}" style="margin-top:16px" />
        <p style="margin-top:12px;font-size:12px;color:#999">ID: ${data.material.id}</p>
        <script>window.print();window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>QR Code</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">A gerar QR Code...</div>}
          {data && (
            <div className="qr-container">
              <img src={data.qr} alt="QR Code" width={240} height={240} />
              <div className="qr-info">
                <strong>{data.material.descricao}</strong>
                <br />
                {data.material.largura} × {data.material.comprimento} × {data.material.espessura} mm
                <br />
                <small>ID #{data.material.id}</small>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
          {data && (
            <button className="btn btn-primary" onClick={handlePrint}>Imprimir</button>
          )}
        </div>
      </div>
    </div>
  );
}
