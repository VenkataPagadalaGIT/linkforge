"use client";

/**
 * Compatibility shim that maps react-router-dom style APIs to Next.js.
 * Lets us reuse the Lovable/Vite source files with minimal code changes.
 */
import * as React from "react";
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

type LinkProps = React.ComponentProps<typeof NextLink> & {
  to?: string;
  replace?: boolean;
  state?: unknown;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, children, ...rest }, ref) => {
    const resolved = (to ?? href ?? "#") as string;
    // Strip unsupported props
    const { state: _state, replace: _replace, ...clean } = rest as LinkProps;
    void _state;
    void _replace;
    return (
      <NextLink href={resolved} ref={ref as never} {...(clean as object)}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = "Link";

// NavLink — react-router-dom NavLink supports a function className/style receiving {isActive}
type NavLinkProps = Omit<LinkProps, "className" | "style"> & {
  className?: string | ((args: { isActive: boolean; isPending: boolean }) => string);
  style?: React.CSSProperties | ((args: { isActive: boolean; isPending: boolean }) => React.CSSProperties);
  end?: boolean;
};

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, href, className, style, end, children, ...rest }, ref) => {
    const pathname = usePathname() || "/";
    const target = (to ?? href ?? "#") as string;
    const isActive = end ? pathname === target : pathname === target || pathname.startsWith(target + "/");
    const resolvedClass = typeof className === "function" ? className({ isActive, isPending: false }) : className;
    const resolvedStyle = typeof style === "function" ? style({ isActive, isPending: false }) : style;
    return (
      <NextLink
        href={target}
        ref={ref as never}
        className={resolvedClass}
        style={resolvedStyle}
        {...(rest as object)}
      >
        {children}
      </NextLink>
    );
  }
);
NavLink.displayName = "NavLink";

export const useNavigate = () => {
  const router = useRouter();
  return React.useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      if (options?.replace) router.replace(to);
      else router.push(to);
    },
    [router]
  );
};

export const useLocation = () => {
  const pathname = usePathname() || "/";
  // NOTE: we intentionally do NOT call useSearchParams() here because it forces
  // client-side rendering bail-out during static generation. All callers only
  // consume `pathname`; `search`/`hash` are best-effort client-only values.
  return {
    pathname,
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null,
    key: "default",
  };
};

export const useParams = <T extends Record<string, string | string[] | undefined> = Record<string, string>>() => {
  return (useNextParams() ?? {}) as T;
};

export const useSearchParams = () => {
  const params = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const setParams = (next: URLSearchParams | Record<string, string>) => {
    const usp = next instanceof URLSearchParams ? next : new URLSearchParams(next);
    router.push(`${pathname}?${usp.toString()}`);
  };
  // Return tuple-like object: react-router uses [params, setParams]
  const tuple: [URLSearchParams, typeof setParams] = [
    new URLSearchParams(params?.toString() ?? ""),
    setParams,
  ];
  return tuple;
};

// No-op stubs for APIs that don't translate (kept for compile safety)
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Route = (_: { path?: string; element?: React.ReactNode }) => null;
export const Outlet = () => null;
export const Navigate = ({ to }: { to: string }) => {
  const router = useRouter();
  React.useEffect(() => {
    router.replace(to);
  }, [to, router]);
  return null;
};
