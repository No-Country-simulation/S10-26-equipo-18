import Image from "next/image";

import { cn } from "@/lib/cn";

const LOGO_SRC = "/favicon/android-chrome-192x192.png";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** Isotipo de RepuSense (radar) usado como marca en sidebar, topbar y login. */
export function Logo({ size = 40, className, priority = false }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="RepuSense"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}
