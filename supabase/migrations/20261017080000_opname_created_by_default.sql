-- ============================================================
-- Isi opname.created_by otomatis dengan user yang membuat opname.
--
-- startOpname di client tidak pernah mengirim created_by dan kolom ini
-- tidak punya default, sehingga semua opname tercatat tanpa pembuat dan
-- auditor di riwayat/detail opname tidak bisa ditampilkan. Sama seperti
-- create_transaction, nilainya diambil dari auth.uid(), bukan dari client.
--
-- Opname lama tetap null karena pembuatnya memang tidak tercatat.
-- ============================================================

alter table public.opname
  alter column created_by set default auth.uid();
