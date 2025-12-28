import type { User } from '@/services/akgda/models/User';
import type { UserDetails } from '@/services/akgda/models/UserDetails';

export const mockUser: User = {
    id: 1,
    username: 'mockuser',
    email: 'mockuser@example.com',
    first_name: 'Mock',
    last_name: 'User',
};

export const mockUserDetails: UserDetails = {
    pk: 1,
    username: 'mockuser',
    email: 'mockuser@example.com',
    first_name: 'Mock',
    last_name: 'User',
};
