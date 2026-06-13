export function extractError(error: any): string {
  if (!error) return 'Beklenmeyen bir hata oluştu';
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'Beklenmeyen bir hata oluştu';
}
