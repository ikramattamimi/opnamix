export const opnameKeys = {
  all: ['opname'] as const,
  schedules: () => [...opnameKeys.all, 'schedules'] as const,
  runs: () => [...opnameKeys.all, 'runs'] as const,
  active: () => [...opnameKeys.runs(), 'active'] as const,
  history: () => [...opnameKeys.runs(), 'history'] as const,
  run: (id: string) => [...opnameKeys.runs(), 'detail', id] as const,
};
