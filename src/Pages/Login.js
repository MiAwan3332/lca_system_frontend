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

const bgImageUrl =
  "https://scontent.flhe4-2.fna.fbcdn.net/v/t39.30808-6/414463992_281655228223938_6472109216520204944_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=5f2048&_nc_eui2=AeHiu9iJFBzhz-4JWuZ6AIyy3QGKTqbgZWfdAYpOpuBlZzrWY1San5W3ln-0LB7I2dcw8M54_GEXvO66vV259ySJ&_nc_ohc=iMYUxfsHDD0Q7kNvgHRYgxd&_nc_zt=23&_nc_ht=scontent.flhe4-2.fna&oh=00_AYDbVe5Tt0X-_ugcwgwYS6eVbG1iB9_1YBNXF2KiSq1CYw&oe=665A1615";

const Login = () => {
  const BASE_URL = config.BASE_URL;
  const toast = useToast();
  const navigate = useNavigate();

  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  useEffect(() => {
    // Check if authToken is present in cookies
    const authToken = Cookies.get("authToken");
    if (authToken) {
      // Redirect to dashboard or the page the user came from
      navigate("/dashboard");
    }
  }, []); // Empty dependency array ensures this effect runs only once, similar to componentDidMount

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
      try {
        const response = await axios.post(`${BASE_URL}/users/login`, values);
        if (response.status === 200) {
          // Login successful
          toast({
            title: "Logged in",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          // Save authToken to cookies securely
          const authToken = response.data.authToken;
          const permissions = response.data.permissions;
          Cookies.set("authToken", authToken, { expires: 7, secure: true }); // Expires in 7 days and secure flag set to true
          sessionStorage.setItem("authToken", authToken);
          sessionStorage.setItem("permissions", permissions);
          // Redirect to dashboard with react router
          navigate("/dashboard");
        } else {
          // Handle other status codes if needed
          toast({
            title: "Error",
            description: "An error occurred during login",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        // Handle network errors or server errors
        toast({
          title: "Error",
          description: "An error occurred during login",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
  });

  return (
    <Box
      minHeight="calc(100vh)"
      paddingTop={"3.5rem"}
      className="bg-[#F9FBFC]"
    >
      <VStack
        spacing={6}
        align="stretch"
        width="100%"
        maxW="500px"
        margin="auto"
        paddingX="4"
      >
        <Image
          h={190}
          src="./logo.png"
          alt="Dan Abramov"
          className="mx-auto -mb-10"
        />
        <Box textAlign="center" fontSize="2xl" fontWeight="semibold">
          LCA Dashboard
        </Box>
        <p className="text-center text-sm text-gray-500 -mt-6">
          Welcome back! Please login to your account.
        </p>
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-5 mt-6 bg-white shadow-xl rounded-2xl p-8"
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
