import { PNCPAdapter } from './pncp/PNCPAdapter.js';
import { ComprasRSAdapter } from './compras-rs/ComprasRSAdapter.js';
import { BNCAdapter } from './bnc/BNCAdapter.js';
import { BanrisulAdapter } from './banrisul/BanrisulAdapter.js';
const adapters = new Map();
export function registerAdapter(adapter) {
    adapters.set(adapter.portalSlug, adapter);
}
export function getAdapter(slug) {
    const adapter = adapters.get(slug);
    if (!adapter)
        throw new Error(`Adapter não encontrado para portal: ${slug}`);
    return adapter;
}
export function getAllAdapters() {
    return Array.from(adapters.values());
}
// Registro automático
registerAdapter(new PNCPAdapter());
registerAdapter(new ComprasRSAdapter());
registerAdapter(new BNCAdapter());
registerAdapter(new BanrisulAdapter());
export { PNCPAdapter, ComprasRSAdapter, BNCAdapter, BanrisulAdapter };
//# sourceMappingURL=index.js.map