export const reportKeys = {
  all: ['reports'] as const,
  mutations: (from: string, to: string) => [...reportKeys.all, 'mutations', from, to] as const,
  transactions: (from: string, to: string) =>
    [...reportKeys.all, 'transactions', from, to] as const,
  expiring: (months: number) => [...reportKeys.all, 'expiring', months] as const,
};
