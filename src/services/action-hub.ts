import { Alert, ActionHubItem } from '../types';
import { api } from './api';

/**
 * Fetch all flagged alerts in the user's Action Hub
 */
export const getFlaggedAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await api.get('/api/action-hub');
    return response.data as Alert[];
  } catch (error) {
    console.error('Error fetching flagged alerts:', error);
    throw error;
  }
};

/**
 * Fetch a specific Action Hub alert by ID
 */
export const getFlaggedAlertById = async (id: string): Promise<ActionHubItem> => {
  try {
    const response = await api.get(`/api/action-hub/${id}`);
    return response.data as ActionHubItem;
  } catch (error) {
    console.error(`Error fetching flagged alert ${id}:`, error);
    throw error;
  }
};

/**
 * Flag an alert and add it to Action Hub
 */
export const flagAlert = async (alertId: string): Promise<{ isFlagged: boolean; flagCount: number }> => {
  try {
    const response = await api.post(`/api/action-hub/flag/${alertId}`);
    return response.data as { isFlagged: boolean; flagCount: number };
  } catch (error) {
    console.error(`Error flagging alert ${alertId}:`, error);
    throw error;
  }
};

/**
 * Resolve flags for an alert (admin/manager only)
 */
export const resolveAlertFlags = async (id: string): Promise<{ message: string; status: string }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/resolve`);
    return response.data as { message: string; status: string };
  } catch (error) {
    console.error(`Error resolving flags for alert ${id}:`, error);
    throw error;
  }
};

/**
 * Set the active tab for an Action Hub item
 */
export const setActiveTab = async (id: string, tab: 'notify_guests' | 'message_team' | 'add_notes'): Promise<{ message: string; currentActiveTab: string }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/tab`, { tab });
    return response.data as { message: string; currentActiveTab: string };
  } catch (error) {
    console.error(`Error setting active tab for ${id}:`, error);
    throw error;
  }
};

/**
 * Add a note to an Action Hub item
 */
export const addNote = async (id: string, content: string): Promise<{ message: string; note: unknown }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/notes`, { content });
    return response.data as { message: string; note: unknown };
  } catch (error) {
    console.error(`Error adding note to ${id}:`, error);
    throw error;
  }
};

/**
 * Add a team message for an Action Hub item
 */
export const addTeamMessage = async (
  id: string, 
  content: string, 
  recipients?: string[], 
  isPreWritten?: boolean
): Promise<{ message: string; teamMessage: unknown }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/message`, { 
      content, 
      recipients, 
      isPreWritten 
    });
    return response.data as { message: string; teamMessage: unknown };
  } catch (error) {
    console.error(`Error adding team message to ${id}:`, error);
    throw error;
  }
};

/**
 * Add guests for notification
 */
export const addGuests = async (id: string, guests: { email: string; name?: string }[]): Promise<{ message: string; guests: unknown[] }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/guests`, { guests });
    return response.data as { message: string; guests: unknown[] };
  } catch (error) {
    console.error(`Error adding guests to ${id}:`, error);
    throw error;
  }
};

/**
 * Send notifications to guests
 */
export const notifyGuests = async (id: string, message: string, guestIds?: string[]): Promise<{ message: string; notifiedGuests: number }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/notify`, { 
      message, 
      guestIds 
    });
    return response.data as { message: string; notifiedGuests: number };
  } catch (error) {
    console.error(`Error notifying guests for ${id}:`, error);
    throw error;
  }
};

/**
 * Get action logs for an Action Hub item
 */
export const getActionLogs = async (id: string): Promise<unknown[]> => {
  try {
    const response = await api.get(`/api/action-hub/${id}/logs`);
    return response.data as unknown[];
  } catch (error) {
    console.error(`Error fetching action logs for ${id}:`, error);
    throw error;
  }
};
