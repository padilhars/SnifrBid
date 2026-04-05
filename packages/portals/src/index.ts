import type { IPortalAdapter } from '@snifrbid/portal-core';
import { PNCPAdapter } from './pncp/PNCPAdapter.js';
import { ComprasRSAdapter } from './compras-rs/ComprasRSAdapter.js';
import { BNCAdapter } from './bnc/BNCAdapter.js';
import { BanrisulAdapter } from './banrisul/BanrisulAdapter.js';

const adapters = new Map<string, IPortalAdapter>();

export function registerAdapter(adapter: IPortalAdapter): void {
  adapters.set(adapter.portalSlug, adapter);
}

export function getAdapter(slug: string): IPortalAdapter {
  const adapter = adapters.get(slug);
  if (!adapter) throw new Error(`Adapter não encontrado para portal: ${slug}`);
  return adapter;
}

export function getAllAdapters(): IPortalAdapter[] {
  return Array.from(adapters.values());
}

// Registro automático
registerAdapter(new PNCPAdapter());
registerAdapter(new ComprasRSAdapter());
registerAdapter(new BNCAdapter());
registerAdapter(new BanrisulAdapter());

export { PNCPAdapter, ComprasRSAdapter, BNCAdapter, BanrisulAdapter };
