/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Serializer for confirming a password reset attempt.
 */
export type PasswordResetConfirm = {
    new_password1: string;
    new_password2: string;
    uid: string;
    token: string;
};
