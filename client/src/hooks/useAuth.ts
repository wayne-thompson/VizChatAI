import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
  });

  // Refetch auth status when page loads or when returning from auth
  useEffect(() => {
    const checkAuth = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    };

    // Check auth when focus returns to window (after auth redirect)
    window.addEventListener("focus", checkAuth);
    
    // Also check on page load
    checkAuth();

    return () => window.removeEventListener("focus", checkAuth);
  }, [queryClient]);

  console.log("Auth state:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}