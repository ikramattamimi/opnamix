# Konvensi Ikon

Semua ikon memakai `lucide-react`. Material Icons Round (font dari Google)
dihapus setelah semua halaman dimigrasi di fase 7.

## Cara pakai

```tsx
import { Package } from 'lucide-react';

<Package className="size-5 text-primary" aria-hidden />
```

- Import komponen langsung dari `lucide-react`, bukan lewat wrapper nama
  string.
- Ukuran: ganti class `text-*` ukuran ikon Material dengan `size-*`
  (`text-sm` → `size-4`, `text-base`/`text-lg` → `size-5`, `text-xl` →
  `size-5`, `text-2xl` → `size-6`, `text-4xl` → `size-10`, `text-5xl`/`text-6xl`
  → `size-12`). Class warna (`text-primary`, `text-red-500`, ...) tetap.
- Ikon dekoratif diberi `aria-hidden`. Tombol yang hanya berisi ikon wajib
  punya `aria-label`.
- Prop yang dulu menerima nama ikon string (misalnya `StatCard icon="..."`)
  diganti menjadi tipe `LucideIcon`, lalu dirender sebagai
  `<Icon className=... />`.
- Fungsi yang memetakan tipe ke ikon (misalnya ikon notifikasi) mengembalikan
  `LucideIcon`, bukan string.
- Spinner: `<Loader2 className="size-5 animate-spin" />` menggantikan
  `refresh` + `animate-spin`.

## Pemetaan Material → lucide

| Material | lucide | Material | lucide |
|---|---|---|---|
| `account_balance_wallet` | `Wallet` | `inventory` | `Package` |
| `account_circle` | `CircleUserRound` | `inventory_2` | `Archive` |
| `add` | `Plus` | `key` | `KeyRound` |
| `add_circle` / `add_circle_outline` | `CirclePlus` | `light_mode` | `Sun` |
| `admin_panel_settings` | `ShieldCheck` | `local_shipping` | `Truck` |
| `arrow_back` | `ArrowLeft` | `lock` | `Lock` |
| `arrow_circle_down` | `CircleArrowDown` | `lock_open` | `LockOpen` |
| `arrow_circle_up` | `CircleArrowUp` | `lock_reset` | `RotateCcwKey` |
| `arrow_forward` | `ArrowRight` | `logout` | `LogOut` |
| `assignment` | `ClipboardList` | `mail` | `Mail` |
| `attach_money` | `DollarSign` | `manage_accounts` | `UserCog` |
| `badge` | `IdCard` | `medical_services` | `BriefcaseMedical` |
| `bar_chart` | `ChartColumn` | `medication` | `Pill` |
| `block` | `Ban` | `menu` | `Menu` |
| `bolt` | `Zap` | `monetization_on` | `CircleDollarSign` |
| `bookmark` | `Bookmark` | `notifications` | `Bell` |
| `calendar_month` | `CalendarDays` | `notifications_none` | `Bell` |
| `calendar_today` | `Calendar` | `notifications_off` | `BellOff` |
| `camera_alt` | `Camera` | `payments` | `Banknote` |
| `check` | `Check` | `pending_actions` | `ClipboardClock` |
| `check_circle` | `CircleCheck` | `person` | `User` |
| `checklist` | `ListChecks` | `person_add` | `UserPlus` |
| `chevron_left` | `ChevronLeft` | `person_off` | `UserX` |
| `chevron_right` | `ChevronRight` | `pie_chart` | `ChartPie` |
| `close` | `X` | `play_arrow` | `Play` |
| `cloud_upload` | `CloudUpload` | `playlist_add` | `ListPlus` |
| `comment` | `MessageSquare` | `playlist_add_check` | `ListChecks` |
| `compare_arrows` | `ArrowLeftRight` | `point_of_sale` | `Store` |
| `dangerous` | `OctagonAlert` | `priority_high` | `CircleAlert` |
| `dark_mode` | `Moon` | `receipt_long` | `ReceiptText` |
| `dashboard` | `LayoutDashboard` | `refresh` | `RefreshCw` (spinner: `Loader2`) |
| `delete` | `Trash2` | `report` | `OctagonAlert` |
| `difference` | `Diff` | `save` | `Save` |
| `done_all` | `CheckCheck` | `schedule` | `Clock` |
| `download` / `file_download` | `Download` | `search` | `Search` |
| `edit` | `Pencil` | `search_off` | `SearchX` |
| `edit_note` | `NotebookPen` | `send` | `Send` |
| `error` / `error_outline` | `CircleAlert` | `settings` | `Settings` |
| `event` | `CalendarDays` | `swap_horiz` | `ArrowLeftRight` |
| `event_available` | `CalendarCheck` | `sync` | `RefreshCw` |
| `event_busy` | `CalendarX` | `table_chart` | `Sheet` |
| `expand_more` | `ChevronDown` | `tag` | `Tag` |
| `fact_check` | `ClipboardCheck` | `task_alt` | `CircleCheckBig` |
| `filter_alt_off` | `FunnelX` | `trending_up` | `TrendingUp` |
| `folder` | `Folder` | `tune` | `SlidersHorizontal` |
| `group` | `Users` | `upload` | `Upload` |
| `health_and_safety` | `ShieldPlus` | `verified` / `verified_user` | `BadgeCheck` |
| `history` | `History` | `visibility` | `Eye` |
| `hourglass_empty` / `hourglass_top` | `Hourglass` | `visibility_off` | `EyeOff` |
| `info` | `Info` | `warning` | `TriangleAlert` |

Kalau ada nama Material yang belum ada di tabel ini, pilih padanan lucide
yang paling dekat, pakai di halamanmu, lalu sebutkan di laporan supaya
tabel ini dilengkapi saat merge.
