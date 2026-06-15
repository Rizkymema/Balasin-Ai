import Image from "next/image";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cyan-950 border border-cyan-400/20 items-center justify-center text-xs font-bold text-cyan-400 uppercase",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span>{fallback.substring(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
