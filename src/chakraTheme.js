import { extendTheme } from '@chakra-ui/react'
import '@fontsource-variable/inter';

const theme = extendTheme({
  fonts: {
    body: `'Inter', sans-serif`,
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