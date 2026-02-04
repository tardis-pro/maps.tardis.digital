/* istanbul ignore file */
/* tslint:disable */

export type User = {
    readonly id: number;
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
};
