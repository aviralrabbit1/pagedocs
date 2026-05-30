import { HttpInterceptorFn } from '@angular/common/http';

// Attaches the stored access token to API requests.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('pd_access');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
