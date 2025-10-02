import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, LogOut } from "lucide-react";
import type { User } from "@shared/schema";

export default function Account() {
  const { user, isAuthenticated } = useAuth();
  const typedUser = user as User | undefined;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          {typedUser?.profileImageUrl ? (
            <img 
              src={typedUser.profileImageUrl} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <UserIcon className="h-10 w-10 text-gray-500" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {typedUser?.firstName} {typedUser?.lastName}
            </h2>
            <p className="text-gray-600 flex items-center mt-1">
              <Mail className="h-4 w-4 mr-2" />
              {typedUser?.email}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">Account Actions</h3>
          <Button 
            variant="destructive"
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
