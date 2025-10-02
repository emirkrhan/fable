'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users } from 'lucide-react';

// ⚙️ Configuration
const PRESENCE_TIMEOUT_MS = 60000; // 60 saniye - bu süreden önce görülmeyenler offline

/**
 * Filter active users based on lastSeen timestamp
 * Users who haven't been seen in PRESENCE_TIMEOUT_MS are considered offline
 */
function filterActiveUsers(users) {
  const now = Date.now();
  
  return users.filter(user => {
    if (!user.lastSeen) return false;
    
    // Firestore Timestamp'i Date'e çevir
    let lastSeenDate;
    if (user.lastSeen.toDate) {
      // Firestore Timestamp object
      lastSeenDate = user.lastSeen.toDate();
    } else if (user.lastSeen instanceof Date) {
      // Already a Date
      lastSeenDate = user.lastSeen;
    } else if (typeof user.lastSeen === 'string') {
      // ISO string
      lastSeenDate = new Date(user.lastSeen);
    } else {
      return false;
    }
    
    const timeSinceLastSeen = now - lastSeenDate.getTime();
    
    // 60 saniyeden yeni görülmüş mü?
    return timeSinceLastSeen < PRESENCE_TIMEOUT_MS;
  });
}

export default function ActiveUsers({ activeUsers = [], currentUserId }) {
  // 🔒 Timestamp-based filtering - eski kullanıcıları otomatik temizle
  const recentlyActiveUsers = useMemo(() => {
    return filterActiveUsers(activeUsers);
  }, [activeUsers]);
  
  // Kendisi hariç diğer aktif kullanıcılar
  const otherUsers = recentlyActiveUsers.filter(u => u.userId !== currentUserId);
  
  if (otherUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Only you</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm">
      <div className="flex items-center -space-x-2">
        {otherUsers.slice(0, 4).map((user, index) => (
          <div
            key={user.userId}
            className="relative"
            style={{ zIndex: otherUsers.length - index }}
            title={user.userName || 'Anonymous'}
          >
            <Avatar className="w-6 h-6 border-2 border-background">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback 
                style={{ backgroundColor: user.color || '#888' }}
                className="text-white text-[10px] font-medium"
              >
                {user.userName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Green dot - online indicator */}
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background bg-green-500"
              title="Active now"
            />
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {otherUsers.length > 4 && `+${otherUsers.length - 4} `}
        {otherUsers.length} {otherUsers.length === 1 ? 'user' : 'users'}
      </span>
    </div>
  );
}

