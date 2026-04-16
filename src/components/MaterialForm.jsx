import { useState, useEffect } from 'react';
import { createMateriaPrima, updateMateriaPrima } from '../services/api';
import { useToast } from './Toast';

const EMPTY = {
  descricao: '', largura: '', comprimento: '', espessura: '',
  quantidade: '0', estoque_minimo: '0', estoque_maximo: '',
};

export default function MaterialForm({ material, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!material;

  useEffect(() => {
    if (material) {
      setForm({
        descricao: material.descricao,
        largura: material.largura,
        comprimento: material.comprimento,
        espessura: material.espessura,
        quantidade: material.quantidade,
        estoque_minimo: material.estoque_minimo,
        estoque_maximo: material.estoque_maximo ?? '',
      });
    }
  }, [material]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    if (form.largura === '' || isNaN(form.largura)) e.largura = 'Número inválido';
    if (form.comprimento === '' || isNaN(form.comprimento)) e.comprimento = 'Número inválido';
    if (form.espessura === '' || isNaN(form.espessura)) e.espessura = 'Número inválido';
    if (form.estoque_minimo === '' || isNaN(form.estoque_minimo)) e.estoque_minimo = 'Número inválido';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        descricao: form.descricao.trim(),
        largura: parseFloat(form.largura),
        comprimento: parseFloat(form.comprimento),
        espessura: parseFloat(form.espessura),
        quantidade: parseFloat(form.quantidade) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        estoque_maximo: form.estoque_maximo !== '' ? parseFloat(form.estoque_maximo) : null,
      };

      if (isEdit) {
        await updateMateriaPrima(material.id, payload);
        toast('Matéria-prima atualizada', 'success');
      } else {
        await createMateriaPrima(payload);
        toast('Matéria-prima criada', 'success');
      }
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao guardar';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Descrição *</label>
              <input
                className={`form-input ${errors.descricao ? 'error' : ''}`}
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                placeholder="Ex: Chapa de aço inox"
              />
              {errors.descricao && <small style={{ color: 'var(--danger)' }}>{errors.descricao}</small>}
            </div>

            <div className="form-row-3">
              {['largura', 'comprimento', 'espessura'].map(field => (
                <div className="form-group" key={field}>
                  <label className="form-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)} (mm) *
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    className={`form-input ${errors[field] ? 'error' : ''}`}
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                  />
                  {errors[field] && <small style={{ color: 'var(--danger)' }}>{errors[field]}</small>}
                </div>
              ))}
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input
                  type="number" step="0.01" min="0"
                  className="form-input"
                  value={form.quantidade}
                  onChange={e => set('quantidade', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Mínimo</label>
                <input
                  type="number" step="0.01" min="0"
                  className="form-input"
                  value={form.estoque_minimo}
                  onChange={e => set('estoque_minimo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Máximo</label>
                <input
                  type="number" step="0.01" min="0"
                  className="form-input"
                  value={form.estoque_maximo}
                  onChange={e => set('estoque_maximo', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
