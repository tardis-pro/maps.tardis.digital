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

  const [json, setJson] = useState<string>();

  const onSubmit = async (data: IFormInput) => {

    let data_json = JSON.stringify(data);
    await setJson(JSON.stringify(data))

    try {
      await fetch("http://localhost:8000/api/rest-auth/registration/", {
        method: "POST",
        body: data_json,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }).then(response =>
        response.json().then(data => ({
          data: data,
          status: response.status
        })
        ).then(res => {
          if(res.data.password1 == "This password is too common."){
            setError('password1' , {type: 'custom', message: 'This password is too common.'})
          }
          if(res.data.username == "A user with that username already exists."){
            setError('username' , {type: 'custom', message: 'A user with that username already exists.'})
          }
          if(res.data.email == "A user is already registered with this e-mail address."){
            setError('email' , {type: 'custom', message: 'A user is already registered with this e-mail address.'})
          }
          console.log(res.status, res.data)
          
        }));

    } catch (e) {
      console.log(e);
    }
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