import {
  makeStyles,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Box
} from "@material-ui/core";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { RestAuthService } from "../services/akgda";

interface IFormInput {
  username: string;
  email: string;
  password1: string;
  password2: string;
}

const schema = yup.object().shape({
  username: yup.string().required("Username is required!").min(2, "Username must be at least 2 characters").max(25),
  email: yup.string().required("Email is required!").email(),
  password1: yup.string().required("Password is required!").min(8, "Password must be at least 8 characters").max(120),
  password2: yup.string()
    .oneOf([yup.ref('password1'), null], 'Passwords must match')
});

const useStyles = makeStyles((theme) => ({
  heading: {
    textAlign: "center",
    margin: theme.spacing(1, 0, 4),
  },
  submitButton: {
    marginTop: theme.spacing(4),
    height: 50
  },
}));

export const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<IFormInput>({
    resolver: yupResolver(schema),
  });

  const { heading, submitButton } = useStyles();

  const onSubmit = async (data: IFormInput) => {
    RestAuthService.restAuthRegistrationCreate(data)
        .then((response) => {
            console.log(response)
        })
        .catch((error) => {
            console.log(error)  
        });
    

  };

  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <Typography className={heading} variant="h3">
          Sign Up Form
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register("username")}
            variant="outlined"
            margin="normal"
            label="Username"
            helperText={errors.username?.message}
            error={!!errors.username?.message}
            fullWidth
            required
          />
          <TextField
            {...register("email")}
            variant="outlined"
            margin="normal"
            label="Email"
            helperText={errors.email?.message}
            error={!!errors.email?.message}
            fullWidth
            required
          />
          <TextField
            {...register("password1")}
            variant="outlined"
            margin="normal"
            label="Password"
            helperText={errors.password1?.message}
            error={!!errors.password1?.message}
            type="password"
            fullWidth
            required
          />
          <TextField
            {...register("password2")}
            variant="outlined"
            margin="normal"
            label="Retype Password"
            helperText={errors.password2?.message}
            error={!!errors.password2?.message}
            type="password"
            fullWidth
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={submitButton}
          >
            Sign Up
          </Button>
          <Typography
            className={heading}
            variant="h6"
          >
            <Link
              href="/"
              underline="hover"
            >
              Already have an account?
            </Link>
          </Typography>
        </form>
      </Box>
    </Container>
  );
}

export default Signup;
