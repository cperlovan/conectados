"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "../hook/useToken";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, userInfo, isLoading } = useToken();

  useEffect(() => {
    if (!isLoading && (!token || !userInfo || !['admin', 'superadmin'].includes(userInfo.role))) {
      router.push('/unauthorized');
    }
  }, [token, userInfo, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!token || !userInfo || !['admin', 'superadmin'].includes(userInfo.role)) {
    return null;
  }

  return <>{children}</>;
} 