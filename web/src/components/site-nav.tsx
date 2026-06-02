"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

type SiteNavProps = {
  className?: string;
};

export function SiteNav({ className }: SiteNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/invites");
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const logoHref = isAuthenticated ? "/dashboard" : "/#pricing";

  async function handleSignOut() {
    await logout();
    router.push("/#pricing");
  }

  return (
    <header
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <Link href={logoHref} aria-label="Navigate from logo">
        <Image
          src="/logo-light.png"
          alt="ScriptumAI logo"
          width={170}
          height={56}
          className="h-auto w-auto dark:hidden"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt="ScriptumAI logo"
          width={170}
          height={56}
          className="hidden h-auto w-auto dark:block"
          priority
        />
      </Link>

      <nav className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        {isAuthenticated && isDashboardRoute ? (
          <>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: pathname === "/dashboard" ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Dashboard
            </Link>

            {/* Admin links */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/members"
                  className={buttonVariants({
                    variant: pathname === "/admin/members" ? "secondary" : "ghost",
                    size: "sm",
                  })}
                >
                  Members
                </Link>
                <Link
                  href="/admin/invites"
                  className={buttonVariants({
                    variant: pathname === "/admin/invites" ? "secondary" : "ghost",
                    size: "sm",
                  })}
                >
                  Invites
                </Link>
                <Link
                  href="/departments"
                  className={buttonVariants({
                    variant: pathname === "/departments" ? "secondary" : "ghost",
                    size: "sm",
                  })}
                >
                  Departments
                </Link>
              </>
            )}

            {/* Staff links */}
            {isStaff && (
              <>
                <Link
                  href="/staff/organizations"
                  className={buttonVariants({
                    variant: pathname.startsWith("/staff/organizations") ? "secondary" : "ghost",
                    size: "sm",
                  })}
                >
                  Organizations
                </Link>
                <Link
                  href="/admin"
                  className={buttonVariants({
                    variant: pathname === "/admin" ? "secondary" : "ghost",
                    size: "sm",
                  })}
                >
                  Users
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/"
              className={buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Home
            </Link>

            <Link
              href="/#pricing"
              className={buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Pricing
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: pathname === "/login" ? "secondary" : "outline",
                    size: "sm",
                  })}
                >
                  Sign in
                </Link>

                <Link href="/register" className={buttonVariants({ size: "sm" })}>
                  Create account
                </Link>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
}