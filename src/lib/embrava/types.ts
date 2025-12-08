// Authentication
export interface AuthenticationRequest {
  OrganizationId: string;
  SecretKey: string;
}

export interface AuthenticationResponse {
  Token: string;
  TimeCreated: string;
}

// Webhook
export interface Webhook {
  id: number;
  organization_id: string;
  url: string;
  secret: string;
  type: 'EVENT' | 'WORKSPACE';
}

export interface WebhookCreateRequest {
  url: string;
  secret: string;
  type: 'EVENT' | 'WORKSPACE';
}

export interface WebhookResponse {
  id: number;
  message: string;
  data: Webhook[];
}

// Event (received from Embrava)
export interface EmbravaEventBooking {
  ID: string;
  startTime: string;
  endTime: string;
  badgeNumber: string;
  employeeID: string;
  Action: 'CREATE' | 'UPDATE' | 'CHECKIN' | 'CHECKOUT' | 'CLEANED';
  deskId: string;
}

export interface EmbravaEventStatus {
  state: 'AVAILABLE' | 'AWAY' | 'BUSY' | 'DND' | 'ONCALL' | 'OFFLINE';
  value: string;
}

export interface EmbravaEvent {
  dateCreated: string;
  DeskSignID: string;
  booking: EmbravaEventBooking | null;
  status: EmbravaEventStatus | null;
}

// Workspace (request from Embrava)
export interface WorkspaceRequest {
  DeskSignID: string;
}

export interface WorkspaceResponse {
  DeskID: string;
  DeskName: string;
  Neighborhood: string;
  Floor: string;
  Building: string;
  Timezone: string;
  Mon: [string, string, string];
  Tue: [string, string, string];
  Wed: [string, string, string];
  Thu: [string, string, string];
  Fri: [string, string, string];
  Sat: [string, string, string];
  Sun: [string, string, string];
}

// Booking (sent to Embrava)
export interface BookingRequest {
  DeskSignID: string;
  BookingID: string;
  FirstName: string;
  LastName: string;
  StartTime: string;
  EndTime: string;
  CheckedIn: 0 | 1;
  Cancel: 0 | 1;
  BadgeNumber: string;
  EmployeeId: string;
}

export interface BookingResponse {
  ID: number;
  RMSBookingID: string;
  FirstName: string;
  LastName: string;
  IsCheckedIn: boolean;
  StartTime: string;
  EndTime: string;
  Timezone: string;
  BadgeNumber: string;
  EmployeeId: string;
  DeskSignID: string;
}

// Alert (sent to Embrava)
export interface AlertRequest {
  DeskSignID: string;
  type: 0 | 1; // 0 = booking alert, 1 = custom alert
  ledColor: string;
  ledMode: 0 | 1; // 0 = solid, 1 = pulse
  screenColor: string;
  textColor: string;
  textTemplate: number;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  sound: number;
  soundMode: 0 | 1; // 0 = play once, 1 = repeat
  volume: number;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  id: number;
  message: string;
  data?: T;
}
