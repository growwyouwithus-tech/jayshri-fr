import { Box, Container, Typography, Grid, Link, IconButton } from '@mui/material'
import { Facebook, Twitter, Instagram, LinkedIn, Phone, Email, LocationOn } from '@mui/icons-material'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Jayshri Properties
            </Typography>
            <Typography variant="body2" color="grey.400" paragraph>
              Your trusted partner in finding the perfect plot for your dream home. We offer premium residential and commercial plots in prime locations.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: 'white' }}>
                <Facebook />
              </IconButton>
              <IconButton size="small" sx={{ color: 'white' }}>
                <Twitter />
              </IconButton>
              <IconButton size="small" sx={{ color: 'white' }}>
                <Instagram />
              </IconButton>
              <IconButton size="small" sx={{ color: 'white' }}>
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="grey.400" underline="hover">
                Home
              </Link>
              <Link href="/colonies" color="grey.400" underline="hover">
                Browse Colonies
              </Link>
              <Link href="/my-bookings" color="grey.400" underline="hover">
                My Bookings
              </Link>
              <Link href="/referral" color="grey.400" underline="hover">
                Referral Program
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2" color="grey.400">
                  +91 98765 43210
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2" color="grey.400">
                  info@jayshriproperties.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2" color="grey.400">
                  Mumbai, Maharashtra, India
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: '1px solid', borderColor: 'grey.800', mt: 4, pt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="grey.500">
            © {new Date().getFullYear()} Jayshri Properties. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
