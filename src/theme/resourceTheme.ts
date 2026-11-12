import { createTheme } from '@mui/material/styles';

export const resourceTheme = createTheme({
  palette: {
    primary: { main: '#0f8b8d' },

    secondary: { main: '#14213d' },

    error: { main: '#c64e4e' },

    background: { paper: '#ffffff', default: '#f5f7fa' },
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: 'Inter, Arial, sans-serif',

    button: { textTransform: 'none', fontWeight: 600 },
  },
});
