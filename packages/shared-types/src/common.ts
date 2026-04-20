export type ID = string

export type Cursor = string

export type Timestamp = {
  createdAt: string
  updatedAt: string
}

export type CursorPaginationMeta = {
  nextCursor: string | null
  hasMore: boolean
}

export type CursorPage<T> = {
  data: T[]
  pagination: CursorPaginationMeta
}

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError
