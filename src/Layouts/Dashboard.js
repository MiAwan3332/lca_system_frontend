import React, { useEffect, useSyncExternalStore } from 'react';
import { accessSnapshot, subscribeAccess, refreshAccess } from '../utlls/accessCapabilities';
import { Button, Text } from '@chakra-ui/react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; // Import Outlet from react-router-dom
import { Box, useColorModeValue, Drawer, DrawerContent } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import Sidebar from '../Components/Sidebar.js';
import MobileNav from '../Components/MobileNav.js';
import { extractUserIdFromToken } from '../utlls/useful.js';
import {
  expireAuthSession,
  getAuthToken,
  isAuthSessionExpired,
} from '../utlls/authSession.js';
import { canAccessRoute, isStudentRole, syncStudentProfileStatus } from '../utlls/studentAccess.js';
import { useDispatch } from 'react-redux';
import { fetchUserById } from '../Features/authSlice.js';

function Dashboard() {
  const access = useSyncExternalStore(subscribeAccess, accessSnapshot);
  const dispatch = useDispatch();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { hash, pathname, search } = location;
  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken || isAuthSessionExpired()) {
      expireAuthSession();
      navigate('/login', { replace: true });
      return;
    }

    const userId = extractUserIdFromToken(authToken);
    dispatch(fetchUserById({ userId, authToken }));

    if (pathname === '/') {
      navigate('/dashboard');
      return;
    }

    const enforceStudentAccess = async () => {
      const current = await refreshAccess();
      if (current.error) return;
      if (isStudentRole()) {
        const profileComplete = await syncStudentProfileStatus();
        if (!profileComplete && pathname !== '/student') {
          navigate('/student', { replace: true });
          return;
        }
      }

    };

    enforceStudentAccess();
  }, [pathname, navigate, dispatch]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') refreshAccess(); };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  return (
    <Box minH="100vh" bg={useColorModeValue('#F9FBFC', 'gray.900')}>
      <Sidebar onClose={onClose} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent h="100dvh" maxH="100dvh" overflow="hidden">
          <Sidebar onClose={onClose} isMobileDrawer />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box
        ml={{ base: 0, md: 60 }}
        px={{ base: 3, sm: 4, md: 6 }}
        py={{ base: 3, md: 6 }}
        maxW="100%"
        overflowX="hidden"
      >
        {!access.ready ? <Text>Checking access...</Text> : access.error ? <Box><Text>{access.error}</Text><Button onClick={refreshAccess}>Retry</Button></Box>
          : !canAccessRoute(pathname) ? <Text>You do not have access to this page.</Text> : <Outlet />}
      </Box>
    </Box>
  );
}

export default Dashboard;
