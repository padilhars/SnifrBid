import { getDb, schema } from '@snifrbid/db';
import { eq } from 'drizzle-orm';

export interface CollectionFilter {
  portalId: string;
  portalSlug: string;
  modalidadeCodes: string[];
  ufCodes: string[];
}

export async function buildCollectionFilters(): Promise<CollectionFilter[]> {
  const interesses = await getDb().query.interests.findMany({
    where: eq(schema.interests.isActive, true),
    with: {
      portals: { with: { portal: true } },
      modalidades: { with: { modalidade: true } },
      ufs: true,
    },
  });

  if (interesses.length === 0) return [];

  const portalMap = new Map<string, CollectionFilter>();

  for (const interesse of interesses) {
    for (const ip of interesse.portals) {
      const portalId = ip.portal.id;

      if (!portalMap.has(portalId)) {
        portalMap.set(portalId, {
          portalId,
          portalSlug: ip.portal.adapterKey,
          modalidadeCodes: [],
          ufCodes: [],
        });
      }

      const filter = portalMap.get(portalId)!;

      for (const im of interesse.modalidades) {
        if (!filter.modalidadeCodes.includes(im.modalidade.code)) {
          filter.modalidadeCodes.push(im.modalidade.code);
        }
      }

      for (const iu of interesse.ufs) {
        if (!filter.ufCodes.includes(iu.ufCode)) {
          filter.ufCodes.push(iu.ufCode);
        }
      }
    }
  }

  return Array.from(portalMap.values());
}
