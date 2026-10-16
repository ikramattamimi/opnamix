import { describe, expect, it } from 'vitest';
import { APP_ROUTES } from './routes';
import {
  buildSidebarNodes,
  canAccessRoute,
  getRouteTitle,
  getUserRoles,
  type SidebarNode,
} from './routeUtils';
import { ROUTES } from '@/types/routes';

// Ringkas node sidebar jadi label supaya mudah dibandingkan
const describeNodes = (nodes: SidebarNode[]) =>
  nodes.map((node) => {
    if (node.kind === 'group') return `# ${node.label}`;
    if (node.kind === 'parent')
      return `${node.parent.label} > ${node.children.map((c) => c.sidebar?.label).join(', ')}`;
    return node.route.sidebar?.label;
  });

const routeAt = (path: string) => APP_ROUTES.find((r) => r.path === path)!;

describe('getUserRoles', () => {
  it('memakai roles kalau ada, lalu role tunggal, lalu kosong', () => {
    expect(getUserRoles({ roles: ['admin', 'nakes'], role: 'nakes' })).toEqual(['admin', 'nakes']);
    expect(getUserRoles({ role: 'farmasi' })).toEqual(['farmasi']);
    expect(getUserRoles(null)).toEqual([]);
  });
});

describe('canAccessRoute', () => {
  it('route tanpa roles terbuka untuk semua user', () => {
    expect(canAccessRoute(routeAt(ROUTES.STOK_KELUAR), ['nakes'])).toBe(true);
  });

  it('route staf menolak nakes dan user tanpa role', () => {
    const produk = routeAt(ROUTES.MASTER_DATA_PRODUK);
    expect(canAccessRoute(produk, ['nakes'])).toBe(false);
    expect(canAccessRoute(produk, [])).toBe(false);
    expect(canAccessRoute(produk, ['apoteker'])).toBe(true);
  });

  it('manajemen pengguna hanya untuk admin', () => {
    const users = routeAt(ROUTES.USER_MANAGEMENT);
    expect(canAccessRoute(users, ['admin'])).toBe(true);
    expect(canAccessRoute(users, ['farmasi', 'apoteker'])).toBe(false);
  });
});

describe('getRouteTitle', () => {
  it('mencocokkan path statis dan path dengan parameter', () => {
    expect(getRouteTitle('/', APP_ROUTES)).toBe('Dasbor Utama');
    expect(getRouteTitle(ROUTES.STOK_OPNAME, APP_ROUTES)).toBe('Audit Stok (Opname)');
    expect(getRouteTitle('/audit/stok-opname/pelaksanaan/abc', APP_ROUTES)).toBe(
      'Pelaksanaan Opname',
    );
    expect(getRouteTitle('/audit/stok-opname/detail/abc', APP_ROUTES)).toBe('Detail Opname');
  });

  it('memakai judul bawaan untuk path yang tidak dikenal', () => {
    expect(getRouteTitle('/tidak-ada', APP_ROUTES)).toBe('Opnamix');
  });
});

describe('buildSidebarNodes', () => {
  it('admin melihat semua menu', () => {
    expect(describeNodes(buildSidebarNodes(APP_ROUTES, ['admin']))).toEqual([
      'Dashboard',
      '# Master Data',
      'Data Produk',
      'Data Jasa',
      '# Transaksi',
      'Stok Masuk',
      'Stok Keluar',
      '# Audit & Kontrol',
      'Stok Opname > Riwayat Opname, Konfigurasi Opname',
      'Notifikasi',
      '# Laporan',
      'Laporan Stok',
      'Kelola Pengguna',
      'Profil',
    ]);
  });

  it.each(['farmasi', 'apoteker'])('%s melihat menu staf tanpa kelola pengguna', (role) => {
    const labels = describeNodes(buildSidebarNodes(APP_ROUTES, [role]));
    expect(labels).toContain('Data Produk');
    expect(labels).toContain('Laporan Stok');
    expect(labels).not.toContain('Kelola Pengguna');
  });

  it('nakes hanya melihat menu umum', () => {
    expect(describeNodes(buildSidebarNodes(APP_ROUTES, ['nakes']))).toEqual([
      'Dashboard',
      '# Transaksi',
      'Stok Keluar',
      'Notifikasi',
      'Profil',
    ]);
  });

  it('setiap menu yang terlihat juga bisa diakses', () => {
    for (const role of ['admin', 'farmasi', 'apoteker', 'nakes']) {
      for (const node of buildSidebarNodes(APP_ROUTES, [role])) {
        const routes =
          node.kind === 'item' ? [node.route] : node.kind === 'parent' ? node.children : [];
        for (const route of routes) expect(canAccessRoute(route, [role])).toBe(true);
      }
    }
  });
});
