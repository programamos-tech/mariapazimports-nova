/**
 * Fondo del sidebar del admin y círculo de avatares (DiceBear).
 * `app/layout.tsx` define `--admin-sidebar-bg` y `--store-chrome-bg` en `<body>` (mismo hex).
 */
export const ADMIN_SIDEBAR_BG = "#fffbf6" as const;

/** Navbar (fila logo/buscador) + footer de la tienda + pantalla de carga. Mismo hex que el sidebar. */
export const STORE_CHROME_BG = ADMIN_SIDEBAR_BG;
