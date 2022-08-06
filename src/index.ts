import axios, { AxiosInstance, AxiosRequestHeaders } from 'axios';
import { isBrowser } from './helper';

type SDKInstance = {
  initialized: boolean;
  projectId: number;
  api: AxiosInstance;
};

const instance: SDKInstance = {
  initialized: false,
  projectId: -1,
  api: axios.create(),
};

// General
export function initCoreEnd(projectId: number) {
  if (instance.initialized) throw new Error('[COREEND] SDK has already been initialized');

  instance.projectId = projectId;
  instance.api = axios.create({
    baseURL: `https://api.coreend.tech/v1/projects/${projectId}/`,
  });
  instance.initialized = true;
}

function enforceIsInitialized() {
  if (!instance.initialized) throw new Error('[COREEND] SDK has not been initialized');
}

// Resource Docs
export function resourceDocs(resourceId: number) {
  enforceIsInitialized();

  async function get({
    id,
    page,
    requireAuth,
  }: { id?: number; page?: number; requireAuth?: boolean } = {}): Promise<
    | { error: null; items: Record<string, any>[] | Record<string, any> }
    | { error: any; items: null }
  > {
    try {
      const withId = typeof id === 'number' ? id : '';
      const withPage = typeof page === 'number' ? `page=${page}` : '';
      const withQuries = `${withPage}`;

      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      const result = await instance.api.get(
        `resources/${resourceId}/docs/${withId}?${withQuries}`,
        { headers: configHeaders }
      );
      const data = result.data as any;

      return { error: null, items: data };
    } catch (error) {
      return { error, items: null };
    }
  }

  async function create(
    item: Record<string, any>,
    requireAuth = false,
    hCaptchaResponse = ''
  ): Promise<{ error: null; id: number } | { error: any; id: null }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      const withHCaptchaResponse = hCaptchaResponse ? `hcaptchaResponse=${hCaptchaResponse}&` : '';
      const withQuries = `${withHCaptchaResponse}`;

      const result = await instance.api.post(
        `resources/${resourceId}/docs?${withQuries}`,
        { data: item },
        {
          headers: configHeaders,
        }
      );

      const data = result.data as number;

      return { error: null, id: data };
    } catch (error) {
      return { error, id: null };
    }
  }

  async function update(
    item: Record<string, any>,
    requireAuth = false
  ): Promise<{ error: null } | { error: any }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      await instance.api.put(
        `resources/${resourceId}/docs`,
        { data: item },
        { headers: configHeaders }
      );

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function remove(
    id: number,
    requireAuth = false
  ): Promise<{ error: null } | { error: any }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      await instance.api.delete(`resources/${resourceId}/docs/${id}`, { headers: configHeaders });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return { get, create, update, remove };
}

// Authentication
type signedInUser = {
  isSignedIn: boolean;
  accessToken: string;
  refreshToken: string;
  expiresOn: number;
};

type Profile = {
  uid: string;
  email: string;
};

const signedInUser: signedInUser = {
  isSignedIn: false,
  accessToken: '',
  refreshToken: '',
  expiresOn: 0,
};

export function authentication() {
  enforceIsInitialized();

  const defaultAccessTokenExpirationInMin = 15;
  const defaultLocalStorageRefreshTokenKey = 'coreend-sdk-authentication-refreshToken';

  if (!signedInUser.isSignedIn && isBrowser()) {
    const refreshToken = window.localStorage.getItem(defaultLocalStorageRefreshTokenKey);

    if (refreshToken) {
      signedInUser.refreshToken = refreshToken;
      signedInUser.isSignedIn = true;
    }
  }

  function isSignedIn() {
    return signedInUser.isSignedIn;
  }

  async function getAccessToken(): Promise<
    { error: null; accessToken: string } | { error: any; accessToken: null }
  > {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');

      // Renew access token if close to expiration
      if (Date.now() >= signedInUser.expiresOn - 1000 * 30) {
        const renewStatus = await renew();

        if (renewStatus.error) {
          await logout();
          throw new Error('Could not renew access token');
        }
      }

      return { error: null, accessToken: signedInUser.accessToken };
    } catch (error) {
      await logout();
      return { error, accessToken: null };
    }
  }

  async function login(email: string): Promise<{ error: null } | { error: any }> {
    try {
      if (isSignedIn()) throw new Error('Already signed in');

      await instance.api.post(`auth/login`, {
        email,
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function verify(email: string, otp: string): Promise<{ error: null } | { error: any }> {
    try {
      if (isSignedIn()) throw new Error('Already signed in');

      const res = await instance.api.post(`auth/verify`, {
        email,
        otp,
      });

      signedInUser.accessToken = res.data.accessToken || '';
      signedInUser.refreshToken = res.data.refreshToken || '';
      signedInUser.expiresOn = Date.now() + 60000 * defaultAccessTokenExpirationInMin;
      signedInUser.isSignedIn = true;

      if (!signedInUser.accessToken || !signedInUser.refreshToken)
        throw new Error('Could not sign in');

      if (isBrowser())
        window.localStorage.setItem(defaultLocalStorageRefreshTokenKey, signedInUser.refreshToken);

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function profile(): Promise<
    { error: null; profile: Profile } | { error: any; profile: null }
  > {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');
      const accessTokenRes = await getAccessToken();

      if (accessTokenRes.error)
        throw new Error(`Can not get access token: ${accessTokenRes.error}`);

      const res = await instance.api.get(`auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessTokenRes.accessToken}`,
        },
      });

      const profile = {
        uid: res.data.uid || '',
        email: res.data.email || '',
      };

      if (!profile.uid || !profile.email) throw new Error('Could not get profile');

      return { error: null, profile };
    } catch (error) {
      return { error, profile: null };
    }
  }

  async function renew(): Promise<{ error: null } | { error: any }> {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');

      const res = await instance.api.post(`auth/renew`, {
        refreshToken: signedInUser.refreshToken,
      });

      signedInUser.accessToken = res.data.accessToken;
      signedInUser.expiresOn = Date.now() + 60000 * defaultAccessTokenExpirationInMin;

      return { error: null };
    } catch (error) {
      await logout();
      return { error };
    }
  }

  async function invalidate(): Promise<{ error: null } | { error: any }> {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');

      await instance.api.post(`auth/invalidate`, {
        refreshToken: signedInUser.refreshToken,
      });

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      await logout();
    }
  }

  async function remove(): Promise<{ error: null } | { error: any }> {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');
      const accessTokenRes = await getAccessToken();

      if (accessTokenRes.error)
        throw new Error(`Can not get access token: ${accessTokenRes.error}`);

      await instance.api.delete(`auth/remove`, {
        headers: {
          Authorization: `Bearer ${accessTokenRes.accessToken}`,
        },
      });

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      await logout();
    }
  }

  async function logout(): Promise<{ error: null } | { error: any }> {
    try {
      if (!isSignedIn()) throw new Error('Not signed in');

      if (isBrowser()) window.localStorage.removeItem(defaultLocalStorageRefreshTokenKey);

      signedInUser.isSignedIn = false;
      signedInUser.accessToken = '';
      signedInUser.refreshToken = '';
      signedInUser.expiresOn = 0;

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return {
    isSignedIn,
    getAccessToken,
    login,
    verify,
    profile,
    renew,
    invalidate,
    remove,
    logout,
  };
}

// Storage Files
export function storageFiles(storageId: number) {
  enforceIsInitialized();

  async function get(
    fileName: string,
    requireAuth = false
  ): Promise<{ error: null; url: any } | { error: any; url: null }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      const result = await instance.api.get(`storages/${storageId}/files/${fileName}`, {
        headers: configHeaders,
      });
      const data = result.data as { url: string };

      return { error: null, url: data.url };
    } catch (error) {
      return { error, url: null };
    }
  }

  async function create(
    file: File,
    fileName?: string,
    requireAuth = false,
    hCaptchaResponse = ''
  ): Promise<{ error: null } | { error: any }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName || file.name);

      const withHCaptchaResponse = hCaptchaResponse ? `hcaptchaResponse=${hCaptchaResponse}&` : '';
      const withQuries = `${withHCaptchaResponse}`;

      await instance.api.post(`storages/${storageId}/files?${withQuries}`, formData, {
        headers: configHeaders,
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function remove(
    fileName: string,
    requireAuth = false
  ): Promise<{ error: null } | { error: any }> {
    try {
      const configHeaders: AxiosRequestHeaders = {};

      if (requireAuth) {
        const authInstance = authentication();
        const accessTokenRes = await authInstance.getAccessToken();

        if (accessTokenRes.error)
          throw new Error(`Can not get access token: ${accessTokenRes.error}`);

        configHeaders.Authorization = `Bearer ${accessTokenRes.accessToken}`;
      }

      await instance.api.delete(`storages/${storageId}/files/${fileName}`, {
        headers: configHeaders,
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return { get, create, remove };
}
