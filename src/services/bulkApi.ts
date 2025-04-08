import { api } from './api';

// Define AxiosError type locally since import is having issues
type AxiosError<T = any> = Error & {
  response?: {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  };
};

export const uploadBulkAlerts = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/bulk-alerts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || (error as Error).message;
  }
};

export const downloadTemplate = async () => {
  try {
    const response = await api.get('/api/bulk-alerts/template', {
      responseType: 'blob',
    });

    // Make sure we're in browser environment
    if (typeof window !== 'undefined') {
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'alert-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || (error as Error).message;
  }
}; 