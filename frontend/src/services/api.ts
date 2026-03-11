import axios from 'axios';
import { OptimizationRequest, OptimizationResponse } from '../types';

const API_BASE_URL = '/api';

export const api = {
  async optimizeRoutes(request: OptimizationRequest): Promise<OptimizationResponse> {
    const response = await axios.post(`${API_BASE_URL}/optimize`, request);
    return response.data;
  },

  async getRouteGeometry(coordinates: string) {
    const response = await axios.get(`${API_BASE_URL}/route/geometry`, {
      params: { coordinates }
    });
    return response.data;
  },

  async healthCheck() {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};