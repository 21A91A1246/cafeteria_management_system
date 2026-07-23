import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name, email, department, password, role) => {
    const response = await api.post('/auth/register', { name, email, department, password, role });
    return response.data;
  },
};

export const menuAPI = {
  getAvailableMenu: async () => {
    const response = await api.get('/menu');
    return response.data;
  },
  getAllMenuAdmin: async () => {
    const response = await api.get('/menu/admin');
    return response.data;
  },
  createMenuItem: async (item) => {
    const response = await api.post('/menu', item);
    return response.data;
  },
  updateMenuItem: async (id, item) => {
    const response = await api.put(`/menu/${id}`, item);
    return response.data;
  },
  deleteMenuItem: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },
};

export const orderAPI = {
  placeOrder: async (employeeName, items) => {
    const response = await api.post('/orders', { employeeName, items });
    return response.data;
  },
  getMyOrders: async (startDate, endDate) => {
    let url = '/orders/my-orders';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  getAllOrdersAdmin: async (filters = {}) => {
    let url = '/orders/admin?';
    const params = new URLSearchParams();
    if (filters.orderId) params.append('orderId', filters.orderId);
    if (filters.employeeName) params.append('employeeName', filters.employeeName);
    if (filters.menuItemName) params.append('menuItemName', filters.menuItemName);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.todayOnly) params.append('todayOnly', 'true');
    
    const response = await api.get(url + params.toString());
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/admin/${id}/status?status=${status}`);
    return response.data;
  },
};

export const reportAPI = {
  getSalesReport: async () => {
    const response = await api.get('/reports/sales');
    return response.data;
  },
};

export const paymentAPI = {
  processPayment: async (orderId, amount, paymentMethod) => {
    const response = await api.post('/payments', { orderId, amount, paymentMethod });
    return response.data;
  },
  getPaymentConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },
  savePaymentConfig: async (config) => {
    const response = await api.post('/payments/config', config);
    return response.data;
  },
};

export default api;
