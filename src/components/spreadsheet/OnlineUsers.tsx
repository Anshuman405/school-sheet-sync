
import React from "react";
import { useUser } from "@clerk/clerk-react";
import { useOthers } from "@/providers/LiveblocksProvider";

const OnlineUsers: React.FC = () => {
  const { user } = useUser();
  const others = useOthers();

  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-2">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm border-2 border-background">
          {user?.firstName ? user.firstName.charAt(0) : user?.username ? user.username.charAt(0) : "U"}
        </div>
        
        {/* Show online users from Liveblocks */}
        {others.map(user => {
          // Safely handle potentially undefined or non-string values
          const firstName = typeof user.presence.firstName === 'string' ? user.presence.firstName : '';
          return (
            <div 
              key={user.connectionId} 
              className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm border-2 border-background"
            >
              {firstName ? firstName.charAt(0) : "U"}
            </div>
          );
        })}
      </div>
      <span className="text-sm text-muted-foreground ml-1">
        {others.length + 1} {others.length + 1 === 1 ? "editor" : "editors"}
      </span>
    </div>
  );
};

export default OnlineUsers;
