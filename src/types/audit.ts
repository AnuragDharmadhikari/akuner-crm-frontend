export type AuditResult = 'SUCCESS' | 'FAILURE'

export interface AuditLogDto {
  id: string
  userId: string | null
  userEmail: string
  action: string
  entityId: string | null
  entityType: string | null
  result: AuditResult
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}