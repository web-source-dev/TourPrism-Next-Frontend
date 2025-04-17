'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Card,
  CardContent,
  FormGroup,
} from '@mui/material';
import { User } from '@/types';
import { updatePreferences } from '@/services/api';

interface PreferencesTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function PreferencesTab({ user, onUpdate }: PreferencesTabProps) {
  // Communication preferences
  const [emailPreferences, setEmailPreferences] = useState(
    user.preferences?.Communication?.emailPrefrences || false
  );
  const [whatsappPreferences, setWhatsappPreferences] = useState(
    user.preferences?.Communication?.whatsappPrefrences || false
  );

  // Alert summary preferences
  const [dailySummary, setDailySummary] = useState(
    user.preferences?.AlertSummaries?.daily || false
  );
  const [weeklySummary, setWeeklySummary] = useState(
    user.preferences?.AlertSummaries?.weekly || false
  );
  const [monthlySummary, setMonthlySummary] = useState(
    user.preferences?.AlertSummaries?.monthly || false
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update form fields when user prop changes
  useEffect(() => {
    setEmailPreferences(user.preferences?.Communication?.emailPrefrences || false);
    setWhatsappPreferences(user.preferences?.Communication?.whatsappPrefrences || false);
    setDailySummary(user.preferences?.AlertSummaries?.daily || false);
    setWeeklySummary(user.preferences?.AlertSummaries?.weekly || false);
    setMonthlySummary(user.preferences?.AlertSummaries?.monthly || false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsSubmitting(true);

      const updateData = {
        communication: {
          emailPrefrences: emailPreferences,
          whatsappPrefrences: whatsappPreferences,
        },
        alertSummaries: {
          daily: dailySummary,
          weekly: weeklySummary,
          monthly: monthlySummary,
        },
      };

      console.log('Submitting preferences update:', updateData);
      const updatedUser = await updatePreferences(updateData);
      onUpdate(updatedUser);
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Preferences
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Stack spacing={4} sx={{ mb: 4 }}>
          {/* Communication Preferences */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Communication Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose how you want to receive updates and notifications.
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailPreferences}
                      onChange={(e) => setEmailPreferences(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={whatsappPreferences}
                      onChange={(e) => setWhatsappPreferences(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="WhatsApp Notifications"
                />
              </FormGroup>
            </CardContent>
          </Card>

          {/* Alert Summary Preferences */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Alert Summary Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which alert summaries you want to receive and how often.
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dailySummary}
                      onChange={(e) => setDailySummary(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Daily Alert Summary"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={weeklySummary}
                      onChange={(e) => setWeeklySummary(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Weekly Alert Summary"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={monthlySummary}
                      onChange={(e) => setMonthlySummary(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Monthly Alert Summary"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Stack>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Paper>
  );
} 