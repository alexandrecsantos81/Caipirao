import { useQuery } from '@tanstack/react-query';
import { getClientes } from '../services/clientes.service';

export function useClientes() {
  return useQuery({ queryKey: ['clientes'], queryFn: getClientes });
}
