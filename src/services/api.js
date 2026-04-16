import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
});

// ── Matéria-Prima ──────────────────────────────────────────
export const getMateriaPrima = () => api.get('/materia-prima').then(r => r.data);
export const getMateriaPrimaById = (id) => api.get(`/materia-prima/${id}`).then(r => r.data);
export const getQRCode = (id) => api.get(`/materia-prima/${id}/qr`).then(r => r.data);
export const createMateriaPrima = (data) => api.post('/materia-prima', data).then(r => r.data);
export const updateMateriaPrima = (id, data) => api.put(`/materia-prima/${id}`, data).then(r => r.data);
export const deleteMateriaPrima = (id) => api.delete(`/materia-prima/${id}`).then(r => r.data);

// ── Stocks ─────────────────────────────────────────────────
export const getStocks = () => api.get('/stocks').then(r => r.data);
export const getStocksByMaterial = (id) => api.get(`/stocks/materia-prima/${id}`).then(r => r.data);
export const createMovimento = (data) => api.post('/stocks', data).then(r => r.data);

// ── Dashboard ──────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard').then(r => r.data);

export default api;
