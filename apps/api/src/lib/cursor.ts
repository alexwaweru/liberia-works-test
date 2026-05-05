export function encodeCursor(id: string): string {
  return btoa(id)
}

export function decodeCursor(cursor: string): string {
  return atob(cursor)
}
