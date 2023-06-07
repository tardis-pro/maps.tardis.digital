import {
    makeStyles,
    Container,
    Typography,
    TextField,
    Button,
    Link,
    Box,
    InputAdornment,
    IconButton
} from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { RestAuthService } from "../services/akgda";

interface IFormInput {
    username: string;
    password: string;
}

const schema = yup.object().shape({
    username: yup.string().required("Username is required").min(2, "Username must be of at least 2 characters").max(25),
    password: yup.string().required("Password is required").min(8, "Password must be of at least 8 characters").max(120)
});

const useStyles = makeStyles((theme) => ({
    heading: {
        textAlign: "center",
        margin: theme.spacing(0, 0, 4),
    },
    submitButton: {
        marginTop: theme.spacing(4),
    }
}));


export const Signin = () => {

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<IFormInput>({
        resolver: yupResolver(schema),
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const { heading, submitButton } = useStyles();

    const onSubmit = async (data: IFormInput) => {
        try {
    
          await RestAuthService.restAuthLoginCreate(data)
    
        } catch (e: any) {
          const body = e.body;
          Object.keys(body).forEach((key: any) => {
            console.log(key)
            setError('password', { type: 'custom', message: body[key] })
          })
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
                    Sign In
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextField
                        {...register("username")}
                        id="standard-error-helper-text"
                        margin="normal"
                        label="Username"
                        helperText={errors.username?.message}
                        error={!!errors.username?.message}
                        fullWidth
                        required
                    />
                    <TextField
                        {...register("password")}
                        id="standard-error-helper-text"
                        margin="normal"
                        label="Password"
                        helperText={errors.password?.message}
                        error={!!errors.password?.message}
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        required
                        InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  onMouseDown={handleMouseDownPassword}
                                >
                                  {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={submitButton}
                    >
                        Sign In
                    </Button>
                    <Box display="flex" justifyContent="space-between">
                        <Typography
                            style={{
                                marginTop: 30
                            }}
                            variant="h6"
                        >
                            <Link
                                href="resetpassword"
                                underline="hover"
                            >
                                Forgot Password
                            </Link>
                        </Typography>
                        <Typography
                            style={{
                                marginTop: 30
                            }}
                            variant="h6"
                        >
                            <Link
                                href="/signup"
                                underline="hover"
                            >
                                Don't have an account?
                            </Link>
                        </Typography>
                    </Box>
                </form>
            </Box>
        </Container>
    );
}

export default Signin;