import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
};

export function PageContainer({
  children,
  className,
  as = "div",
  id,
}: PageContainerProps) {
  const Tag = as;
  return (
    <Tag id={id} className={cn("page-container", className)}>
      {children}
    </Tag>
  );
}
