import { create } from 'zustand';

interface ContractState {
  instance?: unknown;
  brands?: Record<string, unknown>;
}

export const useContractStore = create<ContractState>(() => ({}));
