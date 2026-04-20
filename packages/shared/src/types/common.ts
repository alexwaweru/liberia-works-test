export type ID = string

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export type Timestamp = {
  createdAt: string
  updatedAt: string
}
