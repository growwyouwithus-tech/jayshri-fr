import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import App from './App'
import store from './store'
import './index.css'

/**
 * Main Entry Point
 * Sets up Redux, Router, Theme, and Toast notifications
 */

// Light theme configuration with dark green color
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#41980a',
      light: '#5cb917',
      dark: '#2d6b07',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#41980a',
      light: '#5cb917',
      dark: '#2d6b07',
    },
    background: {
      default: '#F5F6FB',
      paper: '#FFFFFF',
    },
    divider: 'rgba(17, 24, 39, 0.08)',
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    success: {
      main: '#41980a',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 8px 20px rgba(65, 152, 10, 0.08)',
    ...Array(23).fill('0px 10px 30px rgba(15, 23, 42, 0.08)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F6FB',
          color: '#1F2937',
        },
        a: {
          color: '#41980a',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #41980a 0%, #2d6b07 100%)',
          color: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 12,
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            color: '#FFFFFF',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 12px 40px rgba(65, 152, 10, 0.08)',
          border: '1px solid rgba(65, 152, 10, 0.08)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '12px 24px',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #41980a 0%, #2d6b07 100%)',
          boxShadow: '0px 10px 20px rgba(65, 152, 10, 0.3)',
          '&:hover': {
            background: 'linear-gradient(90deg, #2d6b07 0%, #1f4d05 100%)',
            boxShadow: '0px 12px 24px rgba(65, 152, 10, 0.35)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(120deg, #41980a 0%, #5cb917 100%)',
          color: '#FFFFFF',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#41980a',
                  secondary: '#f1f5f9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
