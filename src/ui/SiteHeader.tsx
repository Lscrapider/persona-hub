"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteContent, siteNavigation } from "@/content/site";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link className="site-header__identity" href="/">
        {siteContent.name}
      </Link>

      <nav aria-label="Primary navigation">
        <ul className="site-header__navigation">
          {siteNavigation.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            const isCurrentPage = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  aria-current={isCurrentPage ? "page" : undefined}
                  className="site-header__link"
                  data-active={isActive || undefined}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
