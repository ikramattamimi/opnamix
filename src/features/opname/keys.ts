export const opnameKeys = {
  all: ['opname'] as const,
  schedules: () => [...opnameKeys.all, 'schedules'] as const,
  // Di bawah schedules(), supaya invalidasi jadwal ikut me-refresh daftar ini
  activeSchedules: () => [...opnameKeys.schedules(), 'active'] as const,
  detail: (id: string) => [...opnameKeys.all, 'detail', id] as const,
  detailView: (id: string) => [...opnameKeys.all, 'detailView', id] as const,
  history: () => [...opnameKeys.all, 'history'] as const,
  upcoming: () => [...opnameKeys.all, 'upcoming'] as const,
  drafts: () => [...opnameKeys.all, 'drafts'] as const,
  lock: () => [...opnameKeys.all, 'lock'] as const,
};
