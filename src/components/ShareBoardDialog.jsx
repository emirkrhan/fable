'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Check, Loader2, X, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ShareBoardDialog({ open, onOpenChange, boardId, sharedWith, onUpdate }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  const getToken = () => localStorage.getItem('auth_token');

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSharing(true);
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");
      await api(`/boards/${boardId}/share`, {
        method: 'POST',
        token,
        body: { email: email.trim() }
      });
      toast.success('Board shared successfully!', { icon: <Check className="w-4 h-4" /> });
      setEmail('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to share board');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (userId) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");
      await api(`/boards/${boardId}/share/${userId}`, {
        method: 'DELETE',
        token
      });
      toast.success('User removed from board', { icon: <Check className="w-4 h-4" /> });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Board</DialogTitle>
          <DialogDescription>
            Share this board with others. They will be able to view and add comments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleShare();
                }
              }}
              disabled={sharing}
            />
            <Button onClick={handleShare} disabled={sharing}>
              {sharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Share'
              )}
            </Button>
          </div>

          {/* Shared Users List */}
          {sharedWith && sharedWith.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Shared with ({sharedWith.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sharedWith.map((share) => (
                  <div
                    key={share.userId}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {share.user?.email || 'Unknown User'}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        Comment only
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnshare(share.userId)}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!sharedWith || sharedWith.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Not shared with anyone yet
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
