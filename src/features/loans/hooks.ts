import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/core/queryClient';
import { useAuthStore } from '@/features/auth/authStore';
import { loanRepository } from './repository';

export const LOANS_KEY = ['loans'] as const;

export const useLoanList = () => {
  const authed = useAuthStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: LOANS_KEY, queryFn: loanRepository.list, enabled: authed });
};

export const useLoanDetail = (id: string) =>
  useQuery({ queryKey: ['loan', id], queryFn: () => loanRepository.get(id) });

export const useLoanEvents = (id: string) =>
  useQuery({ queryKey: ['loan', id, 'events'], queryFn: () => loanRepository.getEvents(id) });

export const reloadLoans = () => queryClient.invalidateQueries({ queryKey: LOANS_KEY });
export const reloadLoan = (id: string) => queryClient.invalidateQueries({ queryKey: ['loan', id] });
