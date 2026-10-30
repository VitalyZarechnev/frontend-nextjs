export const routes = {
  home: '/',
  login: '/login',
  posts: '/posts',
  postDetail: (id: number | string) => `/posts/${id}`,
};
