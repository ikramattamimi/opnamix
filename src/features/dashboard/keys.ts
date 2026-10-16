export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recentTransactions: (page: number, perPage: number) =>
    [...dashboardKeys.all, 'recentTransactions', page, perPage] as const,
};
