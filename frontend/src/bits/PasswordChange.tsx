import {
    makeStyles,
    Container,
    Typography,
    TextField,
    Button,
    Box
} from "@material-ui/core";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";

interface IFormInput {
    email: string;
}

const schema = yup.object().shape({
    email: yup.string().required().email()
});

const useStyles = makeStyles((theme) => ({
    heading: {
        textAlign: "center",
        margin: theme.spacing(0, 0, 2),
    },
    submitButton: {
        marginTop: theme.spacing(4),
    }
}));

export const Signup = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<IFormInput>({
        resolver: yupResolver(schema),
    });

    const { heading, submitButton } = useStyles();

    const [setJson] = useState<string>();

    const onSubmit = async (data: IFormInput) => {

        let data_json = JSON.stringify(data);

        try {
            await fetch("http://localhost:8000/api/rest-auth/login/", {
                method: "POST",
                body: data_json,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            })
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
                <Typography className={heading} variant="h6">
                    We will mail you the Reset Link
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextField
                        {...register("email")}
                        variant="outlined"
                        margin="normal"
                        label="Email"
                        helperText={errors.email?.message}
                        error={!!errors.email?.message}
                        type="email"
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
                        Send Mail
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default Signup;