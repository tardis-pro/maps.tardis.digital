/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * User model w/o password
 */
export type UserDetails = {
    readonly pk: number;
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username: string;
    readonly email: string;
    first_name?: string;
    last_name?: string;
};
