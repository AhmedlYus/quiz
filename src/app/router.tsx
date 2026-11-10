// Minimal hash router: URLs look like #/oral/play/<lecture>, so the static build needs no
// server rewrites. Routes are declared in app/routes.tsx; pages read their params with useParams().
import { createContext, forwardRef, useContext, useEffect, useState, type AnchorHTMLAttributes } from 'react';

export type Params = Record<string, string | undefined>;

const currentPath = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
};

export function useLocationPath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function navigate(path: string, { replace = false } = {}) {
  const hash = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

// Pattern segments: literal, ":name" (required) or ":name?" (optional, last only).
export function matchPath(pattern: string, path: string): Params | null {
  const want = pattern.split('/').filter(Boolean);
  const got = path.split('?')[0].split('/').filter(Boolean);
  const params: Params = {};
  for (let i = 0; i < Math.max(want.length, got.length); i++) {
    const w = want[i];
    const g = got[i];
    if (w === undefined) return null;
    if (w.startsWith(':')) {
      const optional = w.endsWith('?');
      const name = w.slice(1, optional ? -1 : undefined);
      if (g === undefined) {
        if (!optional) return null;
        continue;
      }
      try {
        params[name] = decodeURIComponent(g);
      } catch {
        return null;
      }
    } else if (w !== g) {
      return null;
    }
  }
  return params;
}

const ParamsContext = createContext<Params>({});
export const ParamsProvider = ParamsContext.Provider;
export const useParams = <T extends Params = Params>() => useContext(ParamsContext) as T;

// Used by Astryx (via LinkProvider) for every href: "/oral" becomes "#/oral"; other URLs pass through.
export const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink(
  { href, ...rest },
  ref,
) {
  const to = href && href.startsWith('/') ? `#${href}` : href;
  return <a ref={ref} href={to} {...rest} />;
});
