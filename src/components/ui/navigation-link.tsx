'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import globalController from '@/store/globalController';

type NavigationLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  message?: string;
} & Omit<React.ComponentProps<typeof Link>, 'onClick'>;

/**
 * NavigationLink component that shows loading state when navigating
 * The NavigationLoader component in the layout will automatically stop loading when navigation completes
 */
export function NavigationLink({
  href,
  children,
  className,
  onClick,
  message,
  ...props
}: NavigationLinkProps) {
  const pathname = usePathname();

  const handleClick = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    // Only start loading if we're actually navigating to a different page
    if (href !== pathname) {
      globalController.startLoading(message || 'Loading...');
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
