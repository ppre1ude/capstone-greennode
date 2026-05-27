import { getToken } from '@/utils/storage';
import type { ApiResponse } from '@/types';
import { BASE_URL } from './client';
import { createApiError } from './errors';

const MULTIPART_TIMEOUT_MS = 30_000;

export const postMultipart = async <T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> =>
  new Promise(async (resolve, reject) => {
    const token = await getToken();
    const request = new XMLHttpRequest();

    request.open('POST', `${BASE_URL}${path}`);
    request.timeout = MULTIPART_TIMEOUT_MS;
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    request.onload = () => {
      try {
        const responseData = JSON.parse(request.responseText || '{}');
        if (request.status >= 200 && request.status < 300) {
          resolve(responseData);
          return;
        }
        reject(createApiError(request.status, responseData));
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => reject(new Error('Network Error'));
    request.ontimeout = () => reject(new Error('Request timed out'));
    request.send(formData);
  });
