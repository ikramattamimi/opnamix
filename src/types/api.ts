// Tipe hasil (setelah await) dari fungsi API, untuk menurunkan tipe baris
// dari bentuk data yang dikembalikan query.
export type ApiResult<F extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<F>>;
