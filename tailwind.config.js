/** @type {import('tailwindcss').Config} */

// Semua warna membaca variabel CSS di src/index.css. Lihat komentar di sana
// untuk format nilainya.
const solid = (name) => `rgb(var(--${name}) / <alpha-value>)`;
// Token yang sudah membawa alfa sendiri (soft, kaca): tanpa pengubah opasitas
const fixed = (name) => `rgb(var(--${name}))`;

const primary = {
  DEFAULT: solid('primary'),
  foreground: solid('primary-foreground'),
  accent: solid('primary-accent'),
  ink: solid('primary-ink'),
  soft: fixed('primary-soft'),
};

// `bg-primary` adalah isi tombol (berpasangan dengan teks putih). Untuk teks,
// ikon, garis, dan cincin fokus, `*-primary` memakai warna aksen yang tetap
// terbaca di atas permukaan gelap.
const primaryOnSurface = { ...primary, DEFAULT: solid('primary-accent') };
const destructiveOnSurface = { DEFAULT: solid('bad'), foreground: solid('destructive-foreground') };

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: solid('background'),
        foreground: solid('foreground'),
        surface: { DEFAULT: solid('card'), 2: solid('surface-2') },
        faint: solid('faint'),
        card: { DEFAULT: solid('card'), foreground: solid('card-foreground') },
        popover: { DEFAULT: solid('popover'), foreground: solid('popover-foreground') },
        primary,
        secondary: { DEFAULT: solid('secondary'), foreground: solid('secondary-foreground') },
        muted: { DEFAULT: solid('muted'), foreground: solid('muted-foreground') },
        accent: { DEFAULT: solid('accent'), foreground: solid('accent-foreground') },
        destructive: {
          DEFAULT: solid('destructive'),
          foreground: solid('destructive-foreground'),
        },
        ok: { DEFAULT: solid('ok'), soft: fixed('ok-soft') },
        warn: { DEFAULT: solid('warn'), soft: fixed('warn-soft') },
        bad: { DEFAULT: solid('bad'), soft: fixed('bad-soft') },
        info: { DEFAULT: solid('info'), soft: fixed('info-soft') },
        cat: {
          obat: solid('cat-obat'),
          bhp: solid('cat-bhp'),
          imun: solid('cat-imun'),
          alkes: solid('cat-alkes'),
        },
        glass: {
          DEFAULT: fixed('glass'),
          2: fixed('glass-2'),
          line: fixed('glass-line'),
          shade: fixed('glass-shade'),
        },
        'grad-ink': solid('grad-ink'),
        dot: {
          ok: solid('dot-ok'),
          warn: solid('dot-warn'),
          bad: solid('dot-bad'),
          'warn-ink': solid('on-dot-warn'),
        },
        'on-grad': { DEFAULT: solid('on-grad'), 2: fixed('on-grad-2'), 3: fixed('on-grad-3') },
        chart: {
          ser1: solid('ser1'),
          ser2: solid('ser2'),
          minus: solid('viz-minus'),
          plus: solid('viz-plus'),
          grid: solid('grid'),
          r1: solid('r1'),
          r2: solid('r2'),
          r3: solid('r3'),
          r4: solid('r4'),
          r5: solid('r5'),
          r6: solid('r6'),
        },
        scrim: fixed('scrim'),
        border: { DEFAULT: solid('border'), strong: solid('border-strong') },
        input: solid('input'),
        ring: solid('ring'),

        // Nama lama dari desain sebelumnya, sekarang menunjuk ke token baru supaya
        // halaman yang belum dirombak ikut memakai palet baru. Dihapus di Fase 8.
        'background-light': solid('background'),
        'background-dark': solid('background'),
        'card-light': solid('card'),
        'card-dark': solid('card'),
        'text-primary-light': solid('foreground'),
        'text-primary-dark': solid('foreground'),
        'text-secondary-light': solid('muted-foreground'),
        'text-secondary-dark': solid('muted-foreground'),
      },
      textColor: { primary: primaryOnSurface, destructive: destructiveOnSurface },
      borderColor: { primary: primaryOnSurface, destructive: destructiveOnSurface },
      ringColor: { primary: primaryOnSurface },
      outlineColor: { primary: primaryOnSurface },
      fill: { primary: primaryOnSurface },
      stroke: { primary: primaryOnSurface },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Meta 11–13px; `text-xs` (12px) dan `text-sm` (14px) tetap bawaan
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        meta: ['0.8125rem', { lineHeight: '1.125rem' }],
      },
      spacing: {
        // Tinggi tombol lg (38px)
        9.5: '2.375rem',
        // Lebar sidebar: rel ikon dan terbuka
        4.5: '1.125rem',
        6.5: '1.625rem',
        7.5: '1.875rem',
        8.5: '2.125rem',
        rail: '4rem',
        sbw: '14.5rem',
        // Posisi elemen menempel tepat di bawah header halaman
        'below-header': 'calc(var(--page-header-h, 0px) + 1rem)',
      },
      borderRadius: {
        // Kartu 14px, kontrol 8–9px
        DEFAULT: 'var(--radius-control)',
        sm: '0.375rem',
        md: 'var(--radius-control)',
        lg: '0.5625rem',
        xl: '0.75rem',
        '2xl': 'var(--radius)',
        '3xl': '1rem',
        card: 'var(--radius)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        // `shadow` untuk kartu, `shadow-float` untuk panel melayang
        DEFAULT: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        // Nama lama, dihapus di Fase 8
        soft: 'var(--shadow-card)',
      },
      backgroundImage: {
        'grad-hero': 'var(--grad-hero)',
        'grad-side': 'var(--grad-side)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
