import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DealResponse,
  DealsListResponse,
  CreateDealRequest,
  UpdateDealRequest,
  SyncRequest,
  SyncResponse,
  HealthResponse,
} from '../types'

export class ApiClient {
  constructor(private baseUrl: string, private token?: string) {}

    private async request<T>(
    endpoint: string,
    options?: RequestInit
    ): Promise<T> {
    // Start with base headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    // Merge in headers from options (safely)
    if (options?.headers) {
        if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
            headers[key] = value
        })
        } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
            headers[key] = value
        })
        } else {
        Object.assign(headers, options.headers)
        }
    }

    // Add auth token
    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Request failed')
    }

    return response.json()
}


  // Auth
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.token = response.token
    return response
  }

  // Deals
  async getDeals(): Promise<DealsListResponse> {
    return this.request<DealsListResponse>('/deals')
  }

  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    return this.request<DealResponse>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDeal(id: string, data: UpdateDealRequest): Promise<DealResponse> {
    return this.request<DealResponse>(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDeal(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deals/${id}`, {
      method: 'DELETE',
    })
  }

  // Sync
  async sync(data: SyncRequest): Promise<SyncResponse> {
    return this.request<SyncResponse>('/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Health
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }
}
