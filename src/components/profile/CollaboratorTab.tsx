import { Container, Typography, Box } from '@mui/material';
import Head from 'next/head';

const ComingSoon = () => {
  return (
    <>
      <Head>
        <title>Coming Soon | Tourprism</title>
        <meta name="description" content="Something amazing is coming soon." />
      </Head>
      <Box
        sx={{
          minHeight: '60vh',
          bgcolor: 'white',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h2" component="h1" gutterBottom>
            Coming Soon
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default ComingSoon;
