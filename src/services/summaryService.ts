import { api } from './api';

// Types for the summary/forecast feature
export interface SummaryLocation {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface SummaryParameters {
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  alertCategory?: string;
  impact?: string;
  includeDuplicates?: boolean;
}

export interface Summary {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  summaryType: 'custom' | 'automated' | 'forecast';
  parameters: SummaryParameters;
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
  locations?: SummaryLocation[];
  includedAlerts?: string[] | unknown[];
  htmlContent?: string;
  pdfUrl?: string;
  emailDelivery?: {
    scheduled: boolean;
    frequency: 'once' | 'daily' | 'weekly';
    lastSent?: string;
    recipients?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSummaryRequest {
  title: string;
  description?: string;
  summaryType?: 'custom' | 'automated' | 'forecast';
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  alertCategory?: string;
  impact?: string;
  includeDuplicates?: boolean;
  generatePDF?: boolean;
  autoSave?: boolean;
  emailTo?: string[];
}

export interface GenerateSummaryResponse {
  success: boolean;
  summary: {
    title: string;
    description?: string;
    alerts: unknown[];
    duplicates: unknown[][];
    htmlContent: string;
    pdfUrl?: string;
    savedSummaryId?: string;
  };
}

export interface SummaryListResponse {
  success: boolean;
  summaries: Summary[];
}

export interface SummaryDetailResponse {
  success: boolean;
  summary: Summary;
}

export interface ForecastResponse {
  success: boolean;
  forecast: {
    title: string;
    timeRange: {
      startDate: string;
      endDate: string;
    };
    location?: string;
    alertCategory?: string;
    impact?: string;
    alerts: unknown[];
    htmlContent: string;
  };
}

// Service functions
export const generateSummary = async (data: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
  try {
    const response = await api.post<GenerateSummaryResponse>('/api/summaries/generate', data);
    return response.data;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

export const getSavedSummaries = async (): Promise<SummaryListResponse> => {
  try {
    const response = await api.get<SummaryListResponse>('/api/summaries/saved');
    return response.data;
  } catch (error) {
    console.error('Error fetching saved summaries:', error);
    throw error;
  }
};

export const getSummaryById = async (summaryId: string): Promise<SummaryDetailResponse> => {
  try {
    const response = await api.get<SummaryDetailResponse>(`/api/summaries/${summaryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching summary details:', error);
    throw error;
  }
};

export const deleteSummary = async (summaryId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/summaries/${summaryId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting summary:', error);
    throw error;
  }
};

export const getUpcomingForecasts = async (days: number = 7, location?: string, alertCategory?: string, impact?: string): Promise<ForecastResponse> => {
  try {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (location) params.append('location', location);
    if (alertCategory) params.append('alertCategory', alertCategory);
    if (impact) params.append('impact', impact);
    
    const query = params.toString();
    const url = query ? `/api/summaries/forecasts/upcoming?${query}` : '/api/summaries/forecasts/upcoming';
    
    const response = await api.get<ForecastResponse>(url);
    
    // Add error handling for empty responses
    if (!response.data.success || !response.data.forecast) {
      console.warn('No forecast data returned from API');
      return {
        success: false,
        forecast: {
          title: `${days}-Day Alert Forecast`,
          timeRange: { 
            startDate: new Date().toISOString(), 
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
          },
          location: location || '',
          alertCategory,
          impact,
          alerts: [],
          htmlContent: '<p>No alerts found for the specified period.</p>'
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating forecast:', error);
    throw error;
  }
};

export const scheduleSummary = async (data: {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  includeDuplicates?: boolean;
  emailTo: string[];
}): Promise<{ success: boolean; message: string; scheduledSummaryId: string }> => {
  try {
    const response = await api.post<{ 
      success: boolean; 
      message: string; 
      scheduledSummaryId: string 
    }>('/api/summaries/schedule', data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling summary:', error);
    throw error;
  }
};
