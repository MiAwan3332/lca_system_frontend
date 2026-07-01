import { extendTheme } from '@chakra-ui/react'
import '@fontsource-variable/inter';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    body: `'Inter Variable', 'Inter', sans-serif`,
    heading: `'Inter Variable', 'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
  },
  components: {
    Modal: {
      defaultProps: {
        scrollBehavior: 'inside',
        blockScrollOnMount: true,
      },
    },
  },
})

export default theme