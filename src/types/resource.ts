export type ResourceType =
  'equipment' | 'robot' | 'cluster' | 'laboratory' | 'room';

export type ResourceState = 'available' | 'unavailable' | 'maintenance';

export type Resource = {
  id: string;

  name: string;

  type: ResourceType;

  description: string;

  location: string;

  state: ResourceState;

  specifications: Record<string, unknown>;

  managerId: string | null;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
};

export type ResourceInput = Pick<
  Resource,
  'name' | 'type' | 'description' | 'location' | 'state' | 'specifications'
> & {
  managerId?: string | null;
};

export type ResourceListResponse = {
  data: Resource[];

  pagination: {
    page: number;

    pageSize: number;

    totalItems: number;

    totalPages: number;
  };
};

export type ResourceQuery = {
  search?: string;

  type?: ResourceType;

  state?: ResourceState;

  page?: number;

  pageSize?: number;

  availableFrom?: string;

  availableTo?: string;
};

export type AuthUser = {
  id: string;

  fullName: string;

  email: string;

  role: 'user' | 'manager' | 'administrator';

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export type ApiErrorResponse = {
  code: string;

  message: string;

  details?: { field: string; message: string }[];
};

export type CalendarEventType = 'reservation' | 'maintenance';

export type CalendarEvent = {
  id: string;

  resourceId: string;

  resourceName: string;

  reservationId: string | null;

  maintenanceBlockId: string | null;

  startsAt: string;

  endsAt: string;

  status: ReservationState | 'maintenance';

  type: CalendarEventType;

  title: string;

  reason: string | null;
};

export type ReservationState =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type MaintenanceBlock = {
  id: string;

  resourceId: string;

  startsAt: string;

  endsAt: string;

  reason: string;

  createdBy: string | null;

  createdAt: string;
};

export type MaintenanceBlockInput = {
  resourceId: string;

  startsAt: string;

  endsAt: string;

  reason: string;
};

export type CalendarView = 'day' | 'week' | 'month';

export type TimeSlot = {
  label: string;

  start: Date;

  end: Date;
};
