
const API_BASE_URL = "http://localhost:3001";

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
