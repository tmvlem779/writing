import type { Route } from "next";
import Link from "next/link";

export function BrandLogo({ className = "", href = "/" }: { className?: string; href?: Route }) {
  return (
    <Link className={`brand-logo ${className}`.trim()} href={href} aria-label="문득문득 홈">
      <span className="brand-logo-mark" aria-hidden="true">
        <i>문</i>
        <b>✦</b>
      </span>
      <span className="brand-logo-type">문득문득</span>
    </Link>
  );
}
