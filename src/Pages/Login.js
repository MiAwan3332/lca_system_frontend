import React, { useEffect } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Box,
  useToast,
  Image,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";
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

const Login = () => {
  const BASE_URL = config.BASE_URL;
  const toast = useToast();
  const navigate = useNavigate();

  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

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
  }, []);

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
          secure: true,
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
    <Box
      minH="100dvh"
      w="full"
      maxW="100%"
      overflowX="hidden"
      display="flex"
      justifyContent="center"
      alignItems="center"
      px={4}
      position="relative"
      backgroundImage="url('/lca%20upd.png')"
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
    >
      <Box
        position="absolute"
        inset={0}
        bg="whiteAlpha.800"
        pointerEvents="none"
      />
      <VStack
        spacing={6}
        align="stretch"
        width="100%"
        maxW="500px"
        margin="auto"
        position="relative"
        zIndex={1}
      >
        <Image
          h={70}
          src="./logo_light.svg"
          alt="Dan Abramov"
          className="mx-auto"
        />
        {/* <Box textAlign="center" fontSize="2xl" fontWeight="semibold" className="invisible">
          LCA Dashboard
        </Box> */}
        <p className="text-center text-md text-gray-500 -mt-3">
          Welcome back! Please login to your account.
        </p>
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-5 mt-3 bg-white shadow-xl rounded-2xl p-5 sm:p-8"
        >
          <h1 className="text-xl font-medium">Login Form</h1>
          <FormControl
            id="email"
            isInvalid={formik.touched.email && formik.errors.email}
          >
            <FormLabel fontSize={14}>Email</FormLabel>
            <Input
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              borderRadius={"0.75rem"}
              placeholder="Enter your email"
            />
            {formik.touched.email && formik.errors.email ? (
              <Box color="red" fontSize="sm">
                {formik.errors.email}
              </Box>
            ) : null}
          </FormControl>
          <FormControl
            id="password"
            isInvalid={formik.touched.password && formik.errors.password}
          >
            <FormLabel fontSize={14}>Password</FormLabel>
            <InputGroup>
              <Input
                type={show ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                borderRadius={"0.75rem"}
                placeholder="Enter your password"
              />
              <InputRightElement width="2.8rem">
                <IconButton h="1.75rem" size="sm" borderRadius={"0.5rem"} onClick={handleClick}>
                  {show ? <Eye size={18} /> : <EyeOff size={18} />}
                </IconButton>
              </InputRightElement>
            </InputGroup>
            {formik.touched.password && formik.errors.password ? (
              <Box color="red" fontSize="sm">
                {formik.errors.password}
              </Box>
            ) : null}
          </FormControl>
          <Button
            borderRadius={"0.75rem"}
            backgroundColor={"#FFCB82"}
            color={"#85652D"}
            _hover={{
              backgroundColor: "#E3B574",
              color: "#654E26",
            }}
            fontWeight={"500"}
            type="submit"
            width="full"
            loadingText="Signing in..."
            isLoading={formik.isSubmitting}
          >
            Sign in
          </Button>
        </form>
      </VStack>
    </Box>
  );
};

export default Login;
