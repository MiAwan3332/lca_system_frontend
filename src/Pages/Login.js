import React, { useEffect } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Box,
  Flex,
  useToast,
  Image,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  IconButton,
  Text,
  Heading,
  HStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { config } from "../utlls/config.js";
import { storeAuthSession } from "../utlls/useful.js";
import {
  getSessionCookieExpiry,
  isAuthSessionExpired,
  markSessionStarted,
} from "../utlls/authSession.js";
import {
  isStudentRole,
  syncStudentProfileStatus,
} from "../utlls/studentAccess.js";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const Login = () => {
  const BASE_URL = config.BASE_URL;
  const toast = useToast();
  const navigate = useNavigate();

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  useEffect(() => {
    const redirectIfAuthenticated = async () => {
      const authToken = Cookies.get("authToken");
      if (!authToken || isAuthSessionExpired()) return;

      if (isStudentRole()) {
        const profileComplete = await syncStudentProfileStatus();
        navigate(profileComplete ? "/dashboard" : "/student");
      } else {
        navigate("/dashboard");
      }
    };

    redirectIfAuthenticated();
  }, [navigate]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      const completeLogin = (response) => {
        toast({
          title: "Logged in",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        const authToken = response.data.authToken;
        const permissions = response.data.permissions;
        const role = response.data.role;
        const studentId =
          response.data.studentId || response.data.studentData?._id;
        const profileUpdatedOnce =
          response.data.studentData?.profile_updated_once === true;
        const skipProfileCompletion =
          response.data.studentData?.skip_profile_completion === true;
        const profileRequired =
          role?.toLowerCase() === "student" &&
          !profileUpdatedOnce &&
          !skipProfileCompletion;

        const teacherId =
          response.data.teacherId || response.data.teacherData?._id;

        Cookies.set("authToken", authToken, {
          expires: getSessionCookieExpiry(),
          secure: window.location.protocol === "https:",
        });
        markSessionStarted();
        storeAuthSession({
          authToken,
          permissions,
          role,
          studentId,
          teacherId,
          profileUpdatedOnce,
          skipProfileCompletion,
        });

        if (profileRequired) {
          navigate("/student");
        } else {
          navigate("/dashboard");
        }
      };

      try {
        let response;
        try {
          response = await axios.post(`${BASE_URL}/users/adminlogin`, values);
        } catch (adminError) {
          response = await axios.post(`${BASE_URL}/users/login`, values);
        }

        if (response.status === 200) {
          completeLogin(response);
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "An error occurred during login",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
  });

  return (
    <Flex minH="100vh" w="100%" direction={{ base: "column", md: "row" }} overflow="hidden">
      {/* Left side: Premium Branding (Desktop) */}
      <Box
        display={{ base: "none", md: "flex" }}
        flex="1.2"
        bg="gray.900"
        position="relative"
        alignItems="center"
        justifyContent="center"
        px={12}
        overflow="hidden"
      >
        {/* Background Image with subtle scale */}
        <Box
          position="absolute"
          inset={0}
          backgroundImage="url('/lca%20upd.png')"
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          transform="scale(1.05)"
          filter="blur(1px)"
        />
        {/* Modern dark gold gradient overlay */}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(133, 101, 45, 0.8) 100%)"
        />

        {/* Floating background glowing circles for depth */}
        <Box
          position="absolute"
          top="-10%"
          left="-10%"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="rgba(255, 203, 130, 0.1)"
          filter="blur(80px)"
        />
        <Box
          position="absolute"
          bottom="-10%"
          right="-10%"
          w="450px"
          h="450px"
          borderRadius="full"
          bg="rgba(133, 101, 45, 0.15)"
          filter="blur(90px)"
        />

        {/* Content panel */}
        <VStack
          spacing={8}
          align="flex-start"
          maxW="540px"
          position="relative"
          zIndex={1}
          color="white"
          as={motion.div}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariants}>
            <Image
              src="/logo_dark.svg"
              alt="LCA Logo"
              h="54px"
              w="auto"
              objectFit="contain"
            />
          </motion.div>

          <VStack spacing={4} align="flex-start" as={motion.div} variants={fadeUpVariants}>
            <Heading
              fontSize={{ md: "4xl", lg: "5xl" }}
              fontWeight="extrabold"
              lineHeight="1.15"
              letterSpacing="-0.02em"
            >
              Lahore CSS Academy
            </Heading>
            <Text
              fontSize="lg"
              color="gray.300"
              fontWeight="medium"
              lineHeight="tall"
            >
              Empowering Aspirants, Achieving Excellence. Access your customized portal for administrative and student services.
            </Text>
          </VStack>

          <HStack spacing={6} as={motion.div} variants={fadeUpVariants} pt={4}>
            <Box h="2px" w="40px" bg="#FFCB82" />
            <Text fontSize="sm" color="#FFCB82" fontWeight="semibold" letterSpacing="0.1em" textTransform="uppercase">
              Official Portal
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Right side: Modern Login Form */}
      <Flex
        flex="1"
        bg="gray.50"
        alignItems="center"
        justifyContent="center"
        px={{ base: 4, sm: 8, md: 16 }}
        py={12}
        position="relative"
        backgroundImage={{ base: "url('/lca%20upd.png')", md: "none" }}
        backgroundSize="cover"
        backgroundPosition="center"
      >
        {/* Mobile Background Overlay */}
        <Box
          display={{ base: "block", md: "none" }}
          position="absolute"
          inset={0}
          bg="whiteAlpha.900"
          pointerEvents="none"
        />

        <VStack
          spacing={6}
          align="stretch"
          width="100%"
          maxW="420px"
          position="relative"
          zIndex={1}
          as={motion.div}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Header for Mobile only */}
          <Box display={{ base: "block", md: "none" }} textAlign="center" as={motion.div} variants={fadeUpVariants}>
            <Image
              src="/logo_light.svg"
              alt="LCA Logo"
              h="48px"
              w="auto"
              mx="auto"
              mb={4}
              objectFit="contain"
            />
          </Box>

          <VStack spacing={2} align={{ base: "center", md: "flex-start" }} as={motion.div} variants={fadeUpVariants}>
            <Heading fontSize="2xl" fontWeight="bold" color="gray.850">
              Welcome Back
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Enter your credentials to access your dashboard
            </Text>
          </VStack>

          <Box
            as={motion.form}
            onSubmit={formik.handleSubmit}
            variants={fadeUpVariants}
            className="flex flex-col gap-5 bg-white shadow-xl md:shadow-none md:border md:border-gray-200 md:bg-white rounded-2xl p-6 sm:p-8"
          >
            <FormControl
              id="email"
              isInvalid={formik.touched.email && formik.errors.email}
            >
              <FormLabel fontSize={13} fontWeight="semibold" color="gray.600">Email Address</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400" h="44px">
                  <Mail size={18} />
                </InputLeftElement>
                <Input
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  h="44px"
                  pl="10"
                  borderRadius="xl"
                  placeholder="name@example.com"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    bg: "white",
                    borderColor: "#FFCB82",
                    boxShadow: "0 0 0 1px #FFCB82",
                  }}
                />
              </InputGroup>
              {formik.touched.email && formik.errors.email ? (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {formik.errors.email}
                </Text>
              ) : null}
            </FormControl>

            <FormControl
              id="password"
              isInvalid={formik.touched.password && formik.errors.password}
            >
              <FormLabel fontSize={13} fontWeight="semibold" color="gray.600">Password</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400" h="44px">
                  <Lock size={18} />
                </InputLeftElement>
                <Input
                  type={show ? "text" : "password"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  h="44px"
                  pl="10"
                  borderRadius="xl"
                  placeholder="••••••••"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    bg: "white",
                    borderColor: "#FFCB82",
                    boxShadow: "0 0 0 1px #FFCB82",
                  }}
                />
                <InputRightElement width="3rem" h="44px">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    borderRadius="md"
                    onClick={handleClick}
                    _hover={{ bg: "gray.200" }}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <Eye size={16} /> : <EyeOff size={16} />}
                  </IconButton>
                </InputRightElement>
              </InputGroup>
              {formik.touched.password && formik.errors.password ? (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {formik.errors.password}
                </Text>
              ) : null}
            </FormControl>

            <Button
              borderRadius="xl"
              h="44px"
              mt={2}
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(227, 181, 116, 0.2)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
              transition="all 0.2s ease"
              fontWeight="semibold"
              type="submit"
              width="full"
              loadingText="Signing in..."
              isLoading={formik.isSubmitting}
            >
              Sign in
            </Button>
          </Box>
        </VStack>
      </Flex>
    </Flex>
  );
};

export default Login;
