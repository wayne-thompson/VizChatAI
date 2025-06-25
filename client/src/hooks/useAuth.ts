import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  console.log("Auth query result:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}