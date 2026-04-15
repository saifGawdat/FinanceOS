import API from "./axios";

export const invoiceAPI = {
  getInvoices: async ({
    page = 1,
    limit = 10,
    customerId,
    status,
    month,
    year,
    search,
  } = {}) => {
    const response = await API.get("/invoice", {
      params: { page, limit, customerId, status, month, year, search },
    });
    return response.data;
  },

  getInvoice: async (id) => {
    const response = await API.get(`/invoice/${id}`);
    return response.data;
  },

  createInvoice: async (payload) => {
    const response = await API.post("/invoice", payload);
    return response.data;
  },

  updateInvoice: async (id, payload) => {
    const response = await API.put(`/invoice/${id}`, payload);
    return response.data;
  },

  sendInvoice: async (id) => {
    const response = await API.post(`/invoice/${id}/send`);
    return response.data;
  },

  recordPayment: async (id, payload) => {
    const response = await API.post(`/invoice/${id}/payments`, payload);
    return response.data;
  },

  cancelInvoice: async (id) => {
    const response = await API.post(`/invoice/${id}/cancel`);
    return response.data;
  },

  getSummary: async () => {
    const response = await API.get("/invoice/reports/summary");
    return response.data;
  },

  getAging: async () => {
    const response = await API.get("/invoice/reports/aging");
    return response.data;
  },
};

export default invoiceAPI;
