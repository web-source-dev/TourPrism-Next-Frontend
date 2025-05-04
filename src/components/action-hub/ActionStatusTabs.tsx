'use client';

import React from 'react';
import { Box, Tabs, Tab, styled } from '@mui/material';

interface ActionStatusTabsProps {
  tabValue: number;
  pendingCount: number;
  resolvedCount: number;
  totalCount: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

// Styled component for the tab indicator line
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  }
}));

// Styled Tab for mobile-friendly design
const MobileTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  padding: '8px 12px',
  minHeight: '48px',
  [theme.breakpoints.down('sm')]: {
    minWidth: '0px',
    flexShrink: 1,
    padding: '8px 10px',
  },
}));

const ActionStatusTabs: React.FC<ActionStatusTabsProps> = ({
  tabValue,
  pendingCount,
  resolvedCount,
  totalCount,
  onTabChange
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <StyledTabs
        value={tabValue}
        onChange={onTabChange}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          minHeight: '48px',
          '& .MuiTab-root': {
            minHeight: '48px',
          },
        }}
      >
        <MobileTab 
          label={`Pending (${pendingCount})`} 
          sx={{ 
            fontWeight: tabValue === 0 ? 'bold' : 'normal',
          }}
        />
        <MobileTab 
          label={`Resolved (${resolvedCount})`}
          sx={{ 
            fontWeight: tabValue === 1 ? 'bold' : 'normal',
          }}
        />
        <MobileTab 
          label={`All (${totalCount})`}
          sx={{ 
            fontWeight: tabValue === 2 ? 'bold' : 'normal',
          }}
        />
      </StyledTabs>
    </Box>
  );
};

export default ActionStatusTabs; 