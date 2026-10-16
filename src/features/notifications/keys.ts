export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
};
