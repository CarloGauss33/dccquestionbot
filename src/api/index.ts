import axios, { type AxiosRequestConfig } from 'axios';
import * as humps from 'humps';

function api(options: AxiosRequestConfig) {
  return axios({
    ...options,
  }).then(response => {
    if (response.data) {
      return humps.camelizeKeys(response.data) as unknown as Record<string, unknown>
    }

    return [];
  });
}

export default api;
