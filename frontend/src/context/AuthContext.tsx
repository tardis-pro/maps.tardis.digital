import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '../services/akgda';
import { RestAuthService } from '../services/akgda/services/RestAuthService';

interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            OpenAPI.TOKEN = token;
        }
    }, [token]);

    const {
        data: user,
        isLoading: isUserLoading,
        error: userError,
    } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await RestAuthService.restAuthUserRetrieve();
            return {
                id: response.pk,
                username: response.username,
                email: response.email,
                firstName: response.first_name ?? '',
                lastName: response.last_name ?? '',
            } as User;
        },
        enabled: !!token,
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: async ({
            username,
            password,
        }: {
            username: string;
            password: string;
        }) => {
            const response = await RestAuthService.restAuthLoginCreate({
                username,
                password,
            });
            localStorage.setItem('token', response.key);
            OpenAPI.TOKEN = response.key;
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await RestAuthService.restAuthLogoutCreate();
            localStorage.removeItem('token');
            OpenAPI.TOKEN = undefined;
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });

    const login = async (username: string, password: string) => {
        await loginMutation.mutateAsync({ username, password });
    };

    const logout = async () => {
        await logoutMutation.mutateAsync();
    };

    const isLoading =
        isUserLoading || loginMutation.isPending || logoutMutation.isPending;
    const error =
        userError?.message ||
        loginMutation.error?.message ||
        logoutMutation.error?.message ||
        null;

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isAuthenticated: !!token,
                isLoading,
                error,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
