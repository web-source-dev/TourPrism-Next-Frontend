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
    _id?:string;
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
    description?: string;
    timeRange: {
      startDate: string;
      endDate: string;
    };
    location?: string;
    locations?: SummaryLocation[];
    alertCategory?: string;
    impact?: string;
    alerts: unknown[];
    htmlContent: string;
    pdfUrl?: string;
    userRegions?: {
      name: string;
      latitude?: number;
      longitude?: number;
    }[];
  };
}

// Service functions
export const generateSummary = async (data: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
  try {
    const requestData = {
      ...data,
      generatePDF: true,
      autoSave: data.autoSave === true
    };
    
    const response = await api.post<GenerateSummaryResponse>('/api/summaries/generate', requestData);
    
    // If no alerts were found, return a friendly empty state
    if (!response.data.summary.alerts?.length) {
      return {
        success: true,
        summary: {
          ...response.data.summary,
          title: data.title || 'No Alerts Found',
          description: 'No disruptions were found matching your criteria.',
          alerts: [],
          duplicates: [],
          htmlContent: '<div class="no-alerts-message"><p>Your selected region is currently clear of any reported disruptions.</p></div>'
        }
      };
    }
    
    return response.data;
// 138:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
  } catch (error: unknown) {
    console.error('Error generating summary:', error);
    // Create a more detailed error message for logging
    
//  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
    const errorDetail = (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message || (error as unknown as { message?: string }).message || 'Unknown error';
    console.error(`Summary generation failed: ${errorDetail}`);
    
    // Return a user-friendly error state that can be displayed
    return {
      success: true, // Changed to true to handle gracefully in UI
      summary: {
        title: data.title || 'Alert Summary',
        description: 'We encountered an issue while preparing your summary.',
        alerts: [],
        duplicates: [],
        htmlContent: `
          <div class="error-message" style="text-align: center; padding: 30px; margin: 20px 0;">
            <h2 style="color: #666;">Unable to Generate Summary</h2>
            <p style="color: #888; margin-bottom: 10px;">We couldn't generate a complete report at this time.</p>
            <p style="color: #888;">Please try again in a few moments. If the issue persists, contact support.</p>
          </div>
        `
      }
    };
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
    
    // Handle empty forecasts gracefully
    if (!response.data.success || !response.data.forecast || !response.data.forecast.alerts?.length) {
      return {
        success: true, // Changed to true since this is a valid state
        forecast: {
          title: `${days}-Day Alert Forecast`,
          timeRange: { 
            startDate: new Date().toISOString(), 
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
          },
          location: location || 'Your Operating Regions',
          alertCategory,
          impact,
          alerts: [],
          htmlContent: '<div class="no-alerts-message"><p>No alerts found for this period. Your selected regions are currently clear of any reported disruptions.</p></div>',
          userRegions: [] // Empty array for no regions
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating forecast:', error);
    // Return a more user-friendly error state
    return {
      success: true, // Changed to true to handle this gracefully in UI
      forecast: {
        title: 'Temporary Service Disruption',
        timeRange: { 
          startDate: new Date().toISOString(), 
          endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
        },
        location: location || 'Your Operating Regions',
        alerts: [],
        htmlContent: '<div class="error-message"><p>We\'re having trouble accessing the forecast data. Please try again in a few moments.</p></div>',
        userRegions: []
      }
    };
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

// Update the downloadPdf function to handle backend URLs properly
export const downloadPdf = async (pdfUrl: string, filename: string = 'forecast.pdf'): Promise<boolean> => {
  try {
    // Make sure we have a complete URL
    const fullPdfUrl = pdfUrl.startsWith('http') 
      ? pdfUrl 
      : `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${pdfUrl}`;
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = fullPdfUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};

// Add a function to generate PDF on-demand if not available
export const generatePdfOnDemand = async (summaryId: string): Promise<string | null> => {
  try {
    // Special endpoint to specifically generate a PDF for an existing summary
    const response = await api.post<{success: boolean; pdfUrl: string}>(`/api/summaries/${summaryId}/generate-pdf`);
    if (response.data.success && response.data.pdfUrl) {
      return response.data.pdfUrl;
    }
    return null;
  } catch (error) {
    console.error('Error generating PDF on demand:', error);
    return null;
  }
};
