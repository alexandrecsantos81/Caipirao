 // frontend/src/services/clientes.service.ts
 import api from './api';

 export interface Cliente { id: number; nome: string; }

 // A palavra 'export' aqui é crucial
 export const getClientes = async (): Promise<Cliente[]> => {
   const response = await api.get('/api/clientes');
   return response.data;
 };