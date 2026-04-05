import type { IPortalAdapter } from '@snifrbid/portal-core';
import { PNCPAdapter } from './pncp/PNCPAdapter.js';
import { ComprasRSAdapter } from './compras-rs/ComprasRSAdapter.js';
import { BNCAdapter } from './bnc/BNCAdapter.js';
import { BanrisulAdapter } from './banrisul/BanrisulAdapter.js';
export declare function registerAdapter(adapter: IPortalAdapter): void;
export declare function getAdapter(slug: string): IPortalAdapter;
export declare function getAllAdapters(): IPortalAdapter[];
export { PNCPAdapter, ComprasRSAdapter, BNCAdapter, BanrisulAdapter };
//# sourceMappingURL=index.d.ts.map