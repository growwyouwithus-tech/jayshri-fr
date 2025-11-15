import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Divider,
} from '@mui/material'
import { Share, ContentCopy, WhatsApp, Facebook, Twitter, CheckCircle } from '@mui/icons-material'
import toast from 'react-hot-toast'

const Referral = () => {
  const { user } = useSelector((state) => state.auth)
  const [copied, setCopied] = useState(false)

  // Generate referral code from user ID (in real app, this would come from backend)
  const referralCode = user?._id?.substring(0, 8).toUpperCase() || 'REFER123'
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform) => {
    const text = `Join Jayshree Properties and find your dream plot! Use my referral code: ${referralCode}`
    const encodedText = encodeURIComponent(text)
    const encodedLink = encodeURIComponent(referralLink)

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
    }

    window.open(urls[platform], '_blank')
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, textAlign: 'center' }}>
        <Share sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Refer & Earn
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Share your referral code and earn rewards
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>

        {/* Referral Code Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Referral Code
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
                {referralCode}
              </Typography>
              <IconButton onClick={handleCopy} color="primary">
                {copied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Box>

            <TextField
              fullWidth
              value={referralLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button onClick={handleCopy} size="small">
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Share via
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<WhatsApp />}
                  onClick={() => handleShare('whatsapp')}
                  sx={{ py: 1.5 }}
                >
                  WhatsApp
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Facebook />}
                  onClick={() => handleShare('facebook')}
                  sx={{ py: 1.5 }}
                >
                  Facebook
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Twitter />}
                  onClick={() => handleShare('twitter')}
                  sx={{ py: 1.5 }}
                >
                  Twitter
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              How it Works
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip label="1" color="primary" sx={{ mb: 2, fontSize: '1.2rem', width: 40, height: 40 }} />
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    Share Your Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share your unique referral code with friends and family
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip label="2" color="primary" sx={{ mb: 2, fontSize: '1.2rem', width: 40, height: 40 }} />
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    They Register
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your friends sign up using your referral code
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip label="3" color="primary" sx={{ mb: 2, fontSize: '1.2rem', width: 40, height: 40 }} />
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    Earn Rewards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get rewards when they complete their first booking
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Referral
