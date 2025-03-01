import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { OpenAPI } from '../../services/akgda';
import { RestAuthService } from '../../services/akgda/services/RestAuthService';

interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: localStorage.getItem('token') !== null,
    isLoading: false,
    error: null
};

// Async thunks for authentication
export const login = createAsyncThunk(
    'auth/login',
    async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await RestAuthService.restAuthLoginCreate({
                username,
                password
            });

            // Set the token in localStorage and OpenAPI configuration
            localStorage.setItem('token', response.key);
            OpenAPI.TOKEN = response.key;

            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await RestAuthService.restAuthLogoutCreate();

            // Clear token from localStorage and OpenAPI configuration
            localStorage.removeItem('token');
            OpenAPI.TOKEN = undefined;

            return null;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Logout failed');
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await RestAuthService.restAuthUserRetrieve();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch user profile');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
            state.isAuthenticated = action.payload !== null;

            if (action.payload) {
                localStorage.setItem('token', action.payload);
                OpenAPI.TOKEN = action.payload;
            } else {
                localStorage.removeItem('token');
                OpenAPI.TOKEN = undefined;
            }
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(login.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.token = action.payload.key;
            state.isAuthenticated = true;
        });
        builder.addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.isLoading = false;
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
        });
        builder.addCase(logout.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Fetch user profile
        builder.addCase(fetchUserProfile.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = {
                id: action.payload.id,
                username: action.payload.username,
                email: action.payload.email,
                firstName: action.payload.first_name,
                lastName: action.payload.last_name
            };
        });
        builder.addCase(fetchUserProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    }
});

export const { setToken, clearError } = authSlice.actions;

export default authSlice.reducer;
