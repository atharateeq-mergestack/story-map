import { redirect } from 'next/navigation';

export function redirectTo(path: string) {
  redirect(path);
}

export function clientRedirect(path: string) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}
