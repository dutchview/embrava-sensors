import {
  AuthenticationResponse,
  Webhook,
  WebhookResponse,
  BookingRequest,
  AlertRequest,
  ApiResponse,
  BookingResponse,
} from './types';

interface CachedToken {
  token: string;
  timeCreated: Date;
  expiresAt: Date;
}

class EmbravaClient {
  private baseUrl: string;
  private organizationId: string;
  private secretKey: string;
  private cachedToken: CachedToken | null = null;

  constructor() {
    this.baseUrl = process.env.EMBRAVA_API_BASE_URL || 'https://eusfuncapp01.azurewebsites.net/api';
    this.organizationId = process.env.EMBRAVA_ORGANIZATION_ID || '';
    this.secretKey = process.env.EMBRAVA_SECRET_KEY || '';

    if (!this.organizationId || !this.secretKey) {
      console.warn('Embrava credentials not configured. Set EMBRAVA_ORGANIZATION_ID and EMBRAVA_SECRET_KEY.');
    }
  }

  /**
   * Authenticate with the Embrava API and get a token.
   * Token is cached for 6 hours (minus 5 minute buffer).
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid cached token (with 5-minute buffer)
    const bufferMs = 5 * 60 * 1000;
    if (this.cachedToken && this.cachedToken.expiresAt > new Date(Date.now() + bufferMs)) {
      console.log('Using cached Embrava token');
      return this.cachedToken.token;
    }

    console.log('Authenticating with Embrava API...');

    const response = await fetch(`${this.baseUrl}/Authentication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        OrganizationId: this.organizationId,
        SecretKey: this.secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: AuthenticationResponse = await response.json();

    // Cache the token (valid for 6 hours)
    const tokenLifetimeMs = 6 * 60 * 60 * 1000;
    this.cachedToken = {
      token: data.Token,
      timeCreated: new Date(data.TimeCreated),
      expiresAt: new Date(Date.now() + tokenLifetimeMs),
    };

    console.log('Successfully authenticated with Embrava API');
    return this.cachedToken.token;
  }

  /**
   * Get the authorization header with the token.
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      'Content-Type': 'application/json',
      'Dms-Signature-token': token,
    };
  }

  /**
   * Get all webhooks registered for the organization.
   */
  async getWebhooks(): Promise<Webhook[]> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${this.baseUrl}/hook`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get webhooks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Get webhooks response:', JSON.stringify(data, null, 2));

    // Handle different response formats
    // The API may return { Id, Message, data } or just an array
    if (Array.isArray(data)) {
      return data;
    }

    // Check for error response (id !== 0 means error)
    if (typeof data.id === 'number' && data.id !== 0) {
      throw new Error(`Failed to get webhooks: ${data.message}`);
    }

    return data.data || [];
  }

  /**
   * Create a new webhook.
   */
  async createWebhook(url: string, secret: string, type: 'EVENT' | 'WORKSPACE'): Promise<Webhook> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${this.baseUrl}/hook`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        secret,
        type,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Create webhook response:', JSON.stringify(data, null, 2));

    if (typeof data.id === 'number' && data.id !== 0) {
      throw new Error(`Failed to create webhook: ${data.message}`);
    }

    console.log(`Created ${type} webhook: ${url}`);
    return data.data[0];
  }

  /**
   * Delete a webhook by ID.
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${this.baseUrl}/hook/${webhookId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Delete webhook response:', JSON.stringify(data, null, 2));

    if (typeof data.id === 'number' && data.id !== 0) {
      throw new Error(`Failed to delete webhook: ${data.message}`);
    }

    console.log(`Deleted webhook: ${webhookId}`);
  }

  /**
   * Create or update a booking on a Desk Sign.
   */
  async createBooking(booking: BookingRequest): Promise<void> {
    const headers = await this.getAuthHeader();

    console.log('Creating booking with request:', JSON.stringify(booking, null, 2));

    const response = await fetch(`${this.baseUrl}/Booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify(booking),
    });

    console.log('Create booking response status:', response.status, response.statusText);

    if (!response.ok) {
      // Log the error response body
      const errorText = await response.text();
      console.error('Create booking error response:', errorText);
      throw new Error(`Failed to create booking: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: ApiResponse = await response.json();
    console.log('Create booking response data:', JSON.stringify(data, null, 2));

    // Handle both uppercase and lowercase response fields
    const id = (data as any).ID ?? data.id;
    const message = (data as any).Message ?? data.message;

    if (typeof id === 'number' && id !== 0) {
      throw new Error(`Failed to create booking: ${message}`);
    }

    console.log('Booking created successfully');
  }

  /**
   * Get all bookings for a Desk Sign.
   */
  async getBookings(deskSignId: string): Promise<BookingResponse[]> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${this.baseUrl}/Booking/${deskSignId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get bookings: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Get bookings response:', JSON.stringify(data, null, 2));

    // Handle response format: { id, message, result: [] }
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }

    // Fallback to direct array or wrapped data
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  /**
   * Delete a booking.
   * To delete, send a booking request with Cancel: 1
   */
  async deleteBooking(bookingId: string, deskSignId: string): Promise<void> {
    const headers = await this.getAuthHeader();

    // To delete a booking, we send a POST with Cancel: 1
    const deleteRequest: BookingRequest = {
      DeskSignID: deskSignId,
      BookingID: bookingId,
      FirstName: '',
      LastName: '',
      StartTime: '',
      EndTime: '',
      CheckedIn: 0,
      Cancel: 1,
      BadgeNumber: '',
      EmployeeId: '',
    };

    const response = await fetch(`${this.baseUrl}/Booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify(deleteRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete booking: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (data.id !== 0) {
      throw new Error(`Failed to delete booking: ${data.message}`);
    }

    console.log(`Deleted booking: ${bookingId}`);
  }

  /**
   * Send an alert to a Desk Sign.
   */
  async sendAlert(alert: AlertRequest): Promise<void> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${this.baseUrl}/Alert`, {
      method: 'POST',
      headers,
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error(`Failed to send alert: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (data.id !== 0) {
      throw new Error(`Failed to send alert: ${data.message}`);
    }
  }
}

// Singleton instance
export const embravaClient = new EmbravaClient();
