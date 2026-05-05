'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listApplications, getApplication, updateApplicationStatus, createApplication, listMyApplications } from '@/lib/api'
import type { ApplicationListResponse, ApplicationDetail, MyApplicationListResponse } from '@/lib/api'

export const applicationKeys = {
  all: ['applications'] as const,
  byVacancy: (vacancyId: string, filters?: object) => [...applicationKeys.all, vacancyId, filters] as const,
  detail: (vacancyId: string, applicationId: string) => [...applicationKeys.all, vacancyId, applicationId] as const,
}

export function useApplications(vacancyId: string, filters?: { cursor?: string; status?: string }) {
  return useQuery<ApplicationListResponse>({
    queryKey: applicationKeys.byVacancy(vacancyId, filters),
    queryFn: () => listApplications(vacancyId, filters),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useApplication(vacancyId: string, applicationId: string) {
  return useQuery<ApplicationDetail>({
    queryKey: applicationKeys.detail(vacancyId, applicationId),
    queryFn: () => getApplication(vacancyId, applicationId),
    staleTime: 60 * 1000,
  })
}

export function useUpdateApplicationStatus(vacancyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, status, statusNote }: { applicationId: string; status: string; statusNote?: string }) =>
      updateApplicationStatus(applicationId, { status, statusNote }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: applicationKeys.byVacancy(vacancyId) })
      qc.invalidateQueries({ queryKey: applicationKeys.detail(vacancyId, vars.applicationId) })
    },
  })
}

export function useCreateApplication(vacancyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { responses?: Record<string, unknown> }) =>
      createApplication(vacancyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', 'mine'] })
    },
  })
}

export function useMyApplications(params?: { cursor?: string }) {
  return useQuery<MyApplicationListResponse>({
    queryKey: ['applications', 'mine', params],
    queryFn: () => listMyApplications(params),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
