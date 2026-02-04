/* istanbul ignore file */
/* tslint:disable */

import type { Layer } from '../models/Layer';
import type { PasswordReset } from '../models/PasswordReset';
import type { PatchedLayer } from '../models/PatchedLayer';
import type { PatchedProject } from '../models/PatchedProject';
import type { PatchedSource } from '../models/PatchedSource';
import type { PatchedUser } from '../models/PatchedUser';
import type { Project } from '../models/Project';
import type { Source } from '../models/Source';
import type { User } from '../models/User';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class V1Service {
    /**
     * @returns Layer
     * @throws ApiError
     */
    public static v1LayersList(): CancelablePromise<Array<Layer>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/layers/',
        });
    }

    /**
     * @param requestBody
     * @returns Layer
     * @throws ApiError
     */
    public static v1LayersCreate(requestBody: Layer): CancelablePromise<Layer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/layers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns Layer
     * @throws ApiError
     */
    public static v1LayersRetrieve(id: number): CancelablePromise<Layer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/layers/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Layer
     * @throws ApiError
     */
    public static v1LayersUpdate(
        id: number,
        requestBody: Layer
    ): CancelablePromise<Layer> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/layers/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Layer
     * @throws ApiError
     */
    public static v1LayersPartialUpdate(
        id: number,
        requestBody?: PatchedLayer
    ): CancelablePromise<Layer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/layers/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static v1LayersDestroy(id: number): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/layers/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * @returns Project
     * @throws ApiError
     */
    public static v1ProjectsList(): CancelablePromise<Array<Project>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/',
        });
    }

    /**
     * @param requestBody
     * @returns Project
     * @throws ApiError
     */
    public static v1ProjectsCreate(
        requestBody: Project
    ): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/projects/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns Project
     * @throws ApiError
     */
    public static v1ProjectsRetrieve(id: number): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Project
     * @throws ApiError
     */
    public static v1ProjectsUpdate(
        id: number,
        requestBody: Project
    ): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/projects/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Project
     * @throws ApiError
     */
    public static v1ProjectsPartialUpdate(
        id: number,
        requestBody?: PatchedProject
    ): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/projects/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static v1ProjectsDestroy(id: number): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/projects/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * Calls Django Auth PasswordResetForm save method.
     *
     * Accepts the following POST parameters: email
     * Returns the success/fail message.
     * @param requestBody
     * @returns PasswordReset
     * @throws ApiError
     */
    public static v1RestAuthPasswordResetCreate(
        requestBody: PasswordReset
    ): CancelablePromise<PasswordReset> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/rest-auth/password-reset/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns Source
     * @throws ApiError
     */
    public static v1SourcesList(): CancelablePromise<Array<Source>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sources/',
        });
    }

    /**
     * @param requestBody
     * @returns Source
     * @throws ApiError
     */
    public static v1SourcesCreate(
        requestBody: Source
    ): CancelablePromise<Source> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sources/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns Source
     * @throws ApiError
     */
    public static v1SourcesRetrieve(id: number): CancelablePromise<Source> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sources/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Source
     * @throws ApiError
     */
    public static v1SourcesUpdate(
        id: number,
        requestBody: Source
    ): CancelablePromise<Source> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sources/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @param requestBody
     * @returns Source
     * @throws ApiError
     */
    public static v1SourcesPartialUpdate(
        id: number,
        requestBody?: PatchedSource
    ): CancelablePromise<Source> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/sources/{id}/',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static v1SourcesDestroy(id: number): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sources/{id}/',
            path: {
                id: id,
            },
        });
    }

    /**
     * @returns User
     * @throws ApiError
     */
    public static v1UserProfileRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-profile/',
        });
    }

    /**
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static v1UserProfileUpdate(
        requestBody: User
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-profile/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static v1UserProfilePartialUpdate(
        requestBody?: PatchedUser
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/user-profile/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * List my models
     * Retrieve a list of MyModel objects
     * @param sourceId
     * @returns any No response body
     * @throws ApiError
     */
    public static v1WfsRetrieve(sourceId?: string): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wfs/',
            query: {
                source_id: sourceId,
            },
        });
    }
}
