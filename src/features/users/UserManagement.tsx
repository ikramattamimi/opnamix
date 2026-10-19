import React, { useMemo, useState } from 'react';
import { SearchX, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { ResponsiveGrid } from '@/components/data/ResponsiveGrid';
import { ItemCard } from '@/components/data/ItemCard';
import { Pagination } from '@/components/data/Pagination';
import { StatusChip } from '@/components/data/StatusChip';
import { Avatar } from '@/components/data/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useGridPageSize } from '@/hooks/useGridPageSize';
import { useListSelection } from '@/hooks/useListSelection';
import { formatDateForDisplay } from '@/lib/format';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import {
  useCreateUser,
  useDeleteUser,
  useSetUserPassword,
  useUpdateUser,
  useUsers,
} from './useUsers';
import { ROLE_OPTIONS, avatarTone, type RoleValue } from './roles';
import type { UserFormValues } from './schema';
import type { UserRow } from './types';
import { RoleChips } from './components/RoleChips';
import { UserFormPanel } from './components/UserFormPanel';

type RoleFilter = 'Semua' | RoleValue;

const GRID_ROWS = 3;

const userMatches = (u: UserRow, query: string) => {
  const q = query.trim().toLocaleLowerCase('id-ID');
  return !q || `${u.full_name ?? ''} ${u.email ?? ''}`.toLocaleLowerCase('id-ID').includes(q);
};

const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const { user: me } = useAuth();
  const { data: users = [], isPending, isError, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const setUserPassword = useSetUserPassword();

  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('Semua');
  const [page, setPage] = useState(1);
  const [formKey, setFormKey] = useState(0);

  // selectedId kosong = panel "Tambah pengguna"
  const { selectedId, select, panelOpen, openPanel, closePanel, setSelectedId } =
    useListSelection<string>();
  const selected = users.find((u) => u.id === selectedId);

  const grid = useGridPageSize(240, GRID_ROWS);

  const searched = useMemo(() => users.filter((u) => userMatches(u, query)), [users, query]);
  const filtered = searched.filter((u) => role === 'Semua' || u.roles.includes(role));
  const roleCount = (r: RoleFilter) =>
    searched.filter((u) => r === 'Semua' || u.roles.includes(r)).length;
  const adminCount = users.filter((u) => u.roles.includes('admin')).length;

  const pages = Math.max(1, Math.ceil(filtered.length / grid.pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * grid.pageSize, current * grid.pageSize);

  const startNew = () => {
    setSelectedId(null);
    setFormKey((k) => k + 1);
    openPanel();
  };

  const handleSave = async (values: UserFormValues) => {
    try {
      if (selected) {
        await updateUser.mutateAsync({
          userId: selected.id,
          updates: { full_name: values.fullName, email: values.email, roles: values.roles },
        });
        showToast('Perubahan pengguna disimpan.', 'success');
      } else {
        await createUser.mutateAsync({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          roles: values.roles,
        });
        showToast(`${values.fullName} ditambahkan.`, 'success');
      }
      return true;
    } catch (err) {
      console.error('Error saving user:', err);
      showToast('Gagal menyimpan pengguna: ' + getErrorMessage(err), 'error');
      return false;
    }
  };

  const handleDelete = async (user: UserRow) => {
    try {
      await deleteUser.mutateAsync(user.id);
      showToast(`${user.full_name || user.email} dihapus.`, 'success');
      select(null);
      closePanel();
      return true;
    } catch (err) {
      showToast('Gagal menghapus pengguna: ' + getErrorMessage(err), 'error');
      return false;
    }
  };

  const handleResetPassword = async (user: UserRow, password: string) => {
    try {
      await setUserPassword.mutateAsync({ userId: user.id, password });
      showToast(
        `Password ${user.full_name || user.email} diganti. Sampaikan password baru secara langsung.`,
        'success',
      );
      return true;
    } catch (err) {
      showToast('Gagal mengubah password: ' + getErrorMessage(err), 'error');
      return false;
    }
  };

  const isFiltered = !!query.trim() || role !== 'Semua';

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari nama atau email"
          label="Cari pengguna"
        />
        <SegmentedControl<RoleFilter>
          label="Role"
          options={[
            { value: 'Semua', label: 'Semua', count: roleCount('Semua') },
            ...ROLE_OPTIONS.map((r) => ({
              value: r.value,
              label: r.label,
              count: roleCount(r.value),
            })),
          ]}
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        />
      </Toolbar>

      {isPending ? (
        <LoadingState label="Memuat pengguna..." />
      ) : isError ? (
        <ErrorState
          title="Gagal memuat data pengguna"
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <ResponsiveGrid ref={grid.ref} cols={grid.cols}>
            {visible.map((u) => (
              <ItemCard
                key={u.id}
                label={u.full_name || u.email || undefined}
                topStart={
                  <>
                    <Avatar
                      name={u.full_name || u.email}
                      src={u.avatar_url}
                      tone={avatarTone(u.id)}
                      size="lg"
                    />
                    <span className="flex min-w-0 flex-col">
                      <b className="truncate text-label font-semibold">{u.full_name || '-'}</b>
                      <small className="truncate text-xs text-muted-foreground">{u.email}</small>
                    </span>
                  </>
                }
                title={<RoleChips roles={u.roles} />}
                footer={
                  <>
                    <span>Dibuat {formatDateForDisplay(u.created_at ?? undefined)}</span>
                    {u.id === me?.id && <StatusChip tone="info">Anda</StatusChip>}
                  </>
                }
                selected={u.id === selectedId}
                onClick={() => select(u.id)}
              />
            ))}
          </ResponsiveGrid>
          {filtered.length === 0 && (
            <EmptyState
              icon={isFiltered ? SearchX : Users}
              title={isFiltered ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
              description={isFiltered ? 'Ubah kata kunci atau role.' : undefined}
            />
          )}
          <Pagination
            page={current}
            pageSize={grid.pageSize}
            total={filtered.length}
            onPageChange={setPage}
            note={`${grid.pageSize} per halaman (${grid.cols} × ${GRID_ROWS})`}
          />
        </>
      )}
    </Card>
  );

  const panel = (
    <UserFormPanel
      key={`${selected?.id ?? 'new'}-${formKey}`}
      user={selected}
      isSelf={!!selected && selected.id === me?.id}
      saving={createUser.isPending || updateUser.isPending}
      deleting={deleteUser.isPending}
      resetting={setUserPassword.isPending}
      onSave={handleSave}
      onDelete={handleDelete}
      onResetPassword={handleResetPassword}
      onCancel={() => {
        setFormKey((k) => k + 1);
        select(null);
        closePanel();
      }}
    />
  );

  return (
    <>
      <PageHeader
        stats={[
          { id: 'total', label: 'Pengguna', value: users.length },
          { id: 'admin', label: 'Admin', value: adminCount },
        ]}
        actions={
          <Button variant="light" onClick={startNew}>
            <UserPlus aria-hidden />
            Tambah pengguna
          </Button>
        }
      />

      <ListWithPanel list={list} panel={panel} panelOpen={panelOpen} onPanelClose={closePanel} />
    </>
  );
};

export default UserManagement;
