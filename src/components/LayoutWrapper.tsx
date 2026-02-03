// src/components/LayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
  header: ReactNode;
}

export function LayoutWrapper({ 
  children,
  header 
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      {/* Header (masqué dans /admin, avec padding pour éviter sidebar) */}
      {!isAdminRoute && (
        <div className="md:pl-64">
          {header}
        </div>
      )}
      
      {/* Contenu avec padding conditionnel */}
      <div className={isAdminRoute ? "" : "md:pl-64"}>
        {children}
      </div>
    </>
  );
}
