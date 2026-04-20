import type { FastifyPluginAsync } from 'fastify'

/**
 * Audit log module — query interface for the append-only audit_log table.
 *
 * Write path lives in plugins/audit.ts (app.audit.record()).
 * Read path is here — restricted to MOL_DIRECTOR and SYSTEM_ADMIN.
 *
 * Endpoints:
 *   GET /api/v1/audit-log              (paginated, filterable by action/actor/table/date)
 *   GET /api/v1/audit-log/:targetTable/:targetId  (history for a specific record)
 */
export const auditModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 5 (Audit log plumbing)
}

export default auditModule
