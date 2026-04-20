import type { FastifyPluginAsync } from 'fastify'

/**
 * MoL dashboard module — read-only aggregations for Ministry of Labour staff.
 *
 * All endpoints require MOL_OFFICER or MOL_DIRECTOR role.
 * Phase 1: read-only. Phase 2: data corrections + certificate issuance.
 *
 * Endpoints:
 *   GET /api/v1/mol/overview             (KPI summary: employers, individuals, vacancies, permits)
 *   GET /api/v1/mol/employers            (paginated, filterable by county/sector/compliance)
 *   GET /api/v1/mol/employers/:id
 *   GET /api/v1/mol/individuals          (paginated, filterable)
 *   GET /api/v1/mol/individuals/:id
 *   GET /api/v1/mol/vacancies            (all, including drafts)
 *   GET /api/v1/mol/work-permits         (all, filterable by status)
 *   GET /api/v1/mol/disputes             (SLA queue — overdue first)
 *   GET /api/v1/mol/audit-log            (recent audit events, filterable)
 */
export const molModule: FastifyPluginAsync = async (_app) => {
  // TODO: implement in Sprint 0, step 14 (MoL dashboard endpoints)
}

export default molModule
