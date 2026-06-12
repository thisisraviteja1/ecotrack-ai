import { triggerViewChange } from './nextLinkMock';

export function useRouter() {
  return {
    push: (path: string) => {
      triggerViewChange(path);
    },
    prefetch: () => {},
    replace: (path: string) => {
      triggerViewChange(path);
    },
    back: () => {},
  };
}

export function usePathname() {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.replace('#', '');
  return hash ? `/${hash}` : '/';
}
