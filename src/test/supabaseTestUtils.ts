import { vi } from 'vitest'

interface BuilderResult {
  data: unknown
  error: { message: string } | null
}

/**
 * Fake Postgrest query builder matching how useBoards.ts chains calls:
 * every intermediate method returns the same builder, and the builder
 * itself is thenable so it can be awaited mid-chain (e.g. `.update().eq()`)
 * or terminated with `.single()` (e.g. `.insert().select().single()`),
 * same as the real supabase-js builder.
 */
// Returned as `any`: this fake only needs to satisfy supabase-js's chainable,
// thenable shape at runtime, not its much more specific generic builder types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeBuilder(result: BuilderResult): any {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.then = (resolve: (value: BuilderResult) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}
