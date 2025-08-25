import { Heart, Users, MessageCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const MobileDiscoverSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-0">
          <div className="h-96 bg-gray-200 rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const MobileMessagesSkeleton = () => (
  <div className="space-y-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center space-x-3 p-4 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-12" />
      </div>
    ))}
  </div>
);

export const MobileLikesSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-0">
          <div className="h-48 bg-gray-200 rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const MobileTabLoadingIndicator = ({ tab }: { tab: string }) => {
  const getIcon = () => {
    switch (tab) {
      case 'discover': return <Heart className="w-6 h-6" />;
      case 'likes': return <Users className="w-6 h-6" />;
      case 'messages': return <MessageCircle className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="animate-spin text-primary">
        {getIcon()}
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading {tab}...
      </p>
    </div>
  );
};