'use client';

import Layout from '@/components/Layout';
import { Box, Container } from '@mui/material';
import Head from 'next/head';
import ActionHubList from '@/components/action-hub/ActionHubList';

const ActionHub = () => {
  return (
    <Layout isFooter={false}>
      <Head>
        <title>Action Hub | Tourprism</title>
        <meta name="description" content="Manage flagged alerts and take action on important issues." />
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <ActionHubList />
        </Box>
      </Container>
    </Layout>
  );
};

export default ActionHub;
