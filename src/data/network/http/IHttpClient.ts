export type TPayload = object | null | FormData;
export type TParams = Record<string, string | number | boolean | undefined | null> | null;
export type THeaders = Record<string, string>;
export type TRequestOptions = {
  resource: string;
  params?: TParams;
  headers?: THeaders;
  payload?: TPayload;
  url?: string;
  skipEncoding?: boolean;
  skipParsingResponseAsJson?: boolean;
  includeHeaders?: boolean;
  signal?: AbortController;
};

export interface IHttpClient {
  get<TResult>(options: TRequestOptions & { includeHeaders: true }): Promise<{ data: TResult; headers: Headers }>;
  get<TResult>(options: TRequestOptions): Promise<TResult>;

  post<TResult>(options: TRequestOptions & { includeHeaders: true }): Promise<{ data: TResult; headers: Headers }>;
  post<TResult>(options: TRequestOptions): Promise<TResult>;

  patch<TResult>(options: TRequestOptions & { includeHeaders: true }): Promise<{ data: TResult; headers: Headers }>;
  patch<TResult>(options: TRequestOptions): Promise<TResult>;

  put<TResult>(options: TRequestOptions & { includeHeaders: true }): Promise<{ data: TResult; headers: Headers }>;
  put<TResult>(options: TRequestOptions): Promise<TResult>;

  delete<TResult>(options: TRequestOptions & { includeHeaders: true }): Promise<{ data: TResult; headers: Headers }>;
  delete<TResult>(options: TRequestOptions): Promise<TResult>;
}
