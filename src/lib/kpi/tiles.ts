/**
 * Gepinnte KPI-Kacheln — Persistenz in pb-tracking-PB (Collection mkt_kpi_tiles).
 *
 * Warum pb-tracking statt Marketing-PB: die Marketing-PB (pb.kuiper-safety.de)
 * nimmt aktuell keine Schema-/Record-Writes an (DDL-Fehler + Korruptions-Historie,
 * Stand 2026-06-03). pb-tracking ist schreibfähig (Auth+DDL+DML verifiziert) und
 * die App ist ohnehin damit verbunden. Siehe docs/KPI-COCKPIT.md.
 *
 * Eine Kachel speichert NUR die QuerySpec (+ Anzeige-Metadaten). Werte werden
 * bei jedem Dashboard-Aufruf live über die Engine neu berechnet → immer aktuell.
 */
import {
  listTrackingRecords, createTrackingRecord, deleteTrackingRecord, patchTrackingRecord,
} from '@/lib/pb-tracking';
import { METRIC_UNIT, type QuerySpec } from './types';

export const TILES_COLLECTION = 'mkt_kpi_tiles';

export interface KpiTile {
  id: string;
  title: string;
  spec: QuerySpec;
  unit: string;
  position: number;
  span: number;
  viz: string;
}

function parseSpec(raw: any): QuerySpec | null {
  if (!raw) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
  return raw as QuerySpec;
}

export async function listTiles(): Promise<{ tiles: KpiTile[]; error?: string }> {
  const res = await listTrackingRecords(TILES_COLLECTION, { sort: 'position', perPage: 100 });
  if (!res) return { tiles: [], error: 'pb-tracking nicht erreichbar' };
  const tiles = (res.items || [])
    .map((r) => {
      const spec = parseSpec(r.spec);
      if (!spec) return null;
      return {
        id: r.id, title: r.title || spec.title || spec.metric,
        spec, unit: r.unit || METRIC_UNIT[spec.metric] || 'float',
        position: Number(r.position || 0), span: Number(r.span || 1),
        viz: r.viz || 'auto',
      } as KpiTile;
    })
    .filter(Boolean) as KpiTile[];
  return { tiles };
}

export async function pinTile(spec: QuerySpec, owner: string, opts?: { span?: number; viz?: string }): Promise<{ tile?: KpiTile; error?: string }> {
  const { tiles } = await listTiles();
  const maxPos = tiles.reduce((m, t) => Math.max(m, t.position), 0);
  const { record, error } = await createTrackingRecord(TILES_COLLECTION, {
    title: spec.title || spec.metric,
    spec: JSON.stringify(spec),
    unit: METRIC_UNIT[spec.metric] || 'float',
    position: maxPos + 1,
    span: opts?.span || 1,
    viz: opts?.viz || 'auto',
    owner,
  });
  if (error || !record) return { error: error || 'pin fehlgeschlagen' };
  return { tile: { id: record.id, title: record.title, spec, unit: record.unit, position: record.position, span: record.span, viz: record.viz } };
}

export async function unpinTile(id: string): Promise<{ ok: boolean; error?: string }> {
  return deleteTrackingRecord(TILES_COLLECTION, id);
}

export async function reorderTile(id: string, position: number): Promise<{ ok: boolean; error?: string }> {
  return patchTrackingRecord(TILES_COLLECTION, id, { position });
}
