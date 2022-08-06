export declare function initCoreEnd(projectId: number): void;
export declare function resourceDocs(resourceId: number): {
    get: ({ id, page, requireAuth, }?: {
        id?: number | undefined;
        page?: number | undefined;
        requireAuth?: boolean | undefined;
    }) => Promise<{
        error: null;
        items: Record<string, any>[] | Record<string, any>;
    } | {
        error: any;
        items: null;
    }>;
    create: (item: Record<string, any>, requireAuth?: boolean, hCaptchaResponse?: string) => Promise<{
        error: null;
        id: number;
    } | {
        error: any;
        id: null;
    }>;
    update: (item: Record<string, any>, requireAuth?: boolean) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    remove: (id: number, requireAuth?: boolean) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
};
declare type Profile = {
    uid: string;
    email: string;
};
export declare function authentication(): {
    isSignedIn: () => boolean;
    getAccessToken: () => Promise<{
        error: null;
        accessToken: string;
    } | {
        error: any;
        accessToken: null;
    }>;
    login: (email: string) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    verify: (email: string, otp: string) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    profile: () => Promise<{
        error: null;
        profile: Profile;
    } | {
        error: any;
        profile: null;
    }>;
    renew: () => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    invalidate: () => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    remove: () => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    logout: () => Promise<{
        error: null;
    } | {
        error: any;
    }>;
};
export declare function storageFiles(storageId: number): {
    get: (fileName: string, requireAuth?: boolean) => Promise<{
        error: null;
        url: any;
    } | {
        error: any;
        url: null;
    }>;
    create: (file: File, fileName?: string, requireAuth?: boolean, hCaptchaResponse?: string) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
    remove: (fileName: string, requireAuth?: boolean) => Promise<{
        error: null;
    } | {
        error: any;
    }>;
};
export {};
