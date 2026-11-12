import axios from 'axios';
import type { ApiErrorResponse } from '../types/resource';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    axios.isAxiosError<ApiErrorResponse>(error) &&
    error.response?.data.message
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
