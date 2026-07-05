import React, { useEffect } from 'react';
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
      if (isStudentRole()) {
        const profileComplete = await syncStudentProfileStatus();
        if (!profileComplete && pathname !== '/student') {
          navigate('/student', { replace: true });
          return;
        }
      }

      if (!canAccessRoute(pathname)) {
        navigate('/dashboard', { replace: true });
      }
    };

    enforceStudentAccess();
  }, [pathname, navigate, dispatch]);

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
        <Outlet />
      </Box>
    </Box>
  );
}

export default Dashboard;
