-- ============================================================
-- Bucket foto profil (avatars), dipakai uploadAvatar() di lib/auth.ts.
-- Sebelumnya bucket ini tidak ada di migration maupun di project dev,
-- sehingga upload foto profil selalu gagal.
--
-- * Bucket publik, maks 2 MB, hanya gambar (sama dengan validasi di
--   ProfilePage).
-- * File disimpan di <user_id>/avatar.<ext>. Setiap user hanya boleh
--   melihat daftar, upload, menimpa, dan menghapus file di foldernya
--   sendiri.
-- * Policy SELECT dibutuhkan untuk list() dan upload dengan upsert.
--   Menampilkan foto tidak butuh policy karena memakai URL publik.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/*'])
on conflict (id) do nothing;

create policy "Users can list own avatar"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
