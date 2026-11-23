import { apiClient } from './apiClient';
import type { Reservation, ReservationInput } from '../types/resource';

export async function listReservations(scope: 'own' | 'all' = 'own') {
  const response = await apiClient.get<Reservation[]>('/reservations', {
    params: { scope },
  });
  return response.data;
}

export async function createReservation(input: ReservationInput) {
  const response = await apiClient.post<Reservation>('/reservations', input);
  return response.data;
}

export async function updateReservation(
  id: string,
  input: Partial<ReservationInput>,
) {
  const response = await apiClient.put<Reservation>(
    `/reservations/${id}`,
    input,
  );
  return response.data;
}

export async function cancelReservation(id: string) {
  const response = await apiClient.post<Reservation>(
    `/reservations/${id}/cancel`,
  );
  return response.data;
}

export async function reviewReservation(
  id: string,
  status: 'confirmed' | 'rejected',
) {
  const response = await apiClient.patch<Reservation>(
    `/reservations/${id}/review`,
    { status },
  );
  return response.data;
}
