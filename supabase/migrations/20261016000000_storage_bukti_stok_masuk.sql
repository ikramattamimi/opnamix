-- ============================================================
-- Upload bukti stok masuk lewat Supabase Storage (sesi user),
-- menggantikan upload via S3 access key yang ikut terkirim ke browser.
--
-- * Bucket dibuat bila belum ada (dev belum punya), dengan pengaturan
--   yang sama seperti prod: publik, maks 2 MB, hanya gambar.
-- * Hanya staff (admin/farmasi/apoteker) yang boleh upload, dan hanya
--   ke folder receipts/. Tidak ada policy UPDATE/DELETE, jadi bukti
--   yang sudah terupload tidak bisa ditimpa atau dihapus dari browser.
-- * Bucket publik: file tetap bisa dibuka lewat URL publik tanpa
--   policy SELECT.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti-stok-masuk', 'bukti-stok-masuk', true, 2097152, array['image/*'])
on conflict (id) do nothing;

create policy "Staff can upload stock-in receipts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bukti-stok-masuk'
    and (storage.foldername(name))[1] = 'receipts'
    and (select public.is_staff())
  );
