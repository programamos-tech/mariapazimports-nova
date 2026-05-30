/** Punto de venta (columna `stock_local`). */
export const STOCK_LOCAL_LOCATION = "Sincelejo";

/** Inventario central / bodega (columna `stock_warehouse`). */
export const STOCK_WAREHOUSE_LOCATION = "Valledupar";

export const STOCK_LOCAL_LABEL = `Stock en ${STOCK_LOCAL_LOCATION}`;
export const STOCK_WAREHOUSE_LABEL = `Stock en ${STOCK_WAREHOUSE_LOCATION}`;

export const STOCK_LOCAL_SHORT_LABEL = STOCK_LOCAL_LOCATION;
export const STOCK_WAREHOUSE_SHORT_LABEL = STOCK_WAREHOUSE_LOCATION;

export const STOCK_TOTAL_SUMMARY = `${STOCK_LOCAL_LOCATION} + ${STOCK_WAREHOUSE_LOCATION}`;

export const STOCK_CONTROL_HELP_PRIMARY = `El stock en ${STOCK_LOCAL_LOCATION} refleja las unidades disponibles en el punto de venta; ${STOCK_WAREHOUSE_LOCATION} es tu inventario central en bodega.`;

export const STOCK_CONTROL_HELP_SECONDARY = `Puedes ajustar cantidades después desde la lista de productos. La asignación a estantes se habilita cuando hay stock en ${STOCK_WAREHOUSE_LOCATION}.`;

export const STOCK_LOCAL_SUBTITLE = `Punto de venta · ${STOCK_LOCAL_LOCATION}`;
export const STOCK_WAREHOUSE_SUBTITLE = `Bodega · ${STOCK_WAREHOUSE_LOCATION}`;

export const STOCK_TRANSFER_PAGE_INTRO = `Mové unidades entre ${STOCK_LOCAL_LOCATION} (punto de venta) y ${STOCK_WAREHOUSE_LOCATION} (bodega).`;

export const STOCK_TRANSFER_TO_WAREHOUSE = `${STOCK_LOCAL_LOCATION} → ${STOCK_WAREHOUSE_LOCATION}`;
export const STOCK_TRANSFER_TO_LOCAL = `${STOCK_WAREHOUSE_LOCATION} → ${STOCK_LOCAL_LOCATION}`;

export const STOCK_TRANSFER_TO_WAREHOUSE_SUMMARY = `${STOCK_TRANSFER_TO_WAREHOUSE} · movés desde el mostrador hacia bodega`;
export const STOCK_TRANSFER_TO_LOCAL_SUMMARY = `${STOCK_TRANSFER_TO_LOCAL} · movés desde bodega al mostrador`;

export const STOCK_UPDATE_LOCATION_HELP = `Indicá si la entrada o el ajuste aplica al stock en ${STOCK_LOCAL_LOCATION} o en ${STOCK_WAREHOUSE_LOCATION}.`;

export const STOCK_TRANSFER_PREVIEW_HELP = `Escribí una cantidad válida para ver cómo quedará el stock en ${STOCK_LOCAL_LOCATION} y en ${STOCK_WAREHOUSE_LOCATION}.`;

export const STOCK_TRANSFER_TOTAL_NOTE = `El total en listado y en la ficha del producto sigue siendo la suma de ${STOCK_LOCAL_LOCATION} + ${STOCK_WAREHOUSE_LOCATION}.`;

export const STOCK_WAREHOUSE_SHELF_NOTE = `Si usás ubicaciones detalladas en ${STOCK_WAREHOUSE_LOCATION}, el total de bodega sigue reflejado en la columna correspondiente.`;
