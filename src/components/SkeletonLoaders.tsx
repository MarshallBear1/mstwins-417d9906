import { Card, CardContent } from "@/components/ui/card";

export const ProfileCardSkeleton = () => (
  <Card className="w-full max-w-sm mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
    <CardContent className="p-0">
      {/* Image skeleton */}
      <div className="w-full h-64 bg-gray-200 animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex space-x-2 pt-2">
          <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const LikeCardSkeleton = () => (
  <Card className="p-4 bg-white">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex space-x-2">
          <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  </Card>
);

export const MessageThreadSkeleton = () => (
  <div className="border-b border-gray-100 p-4">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
        </div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
      </div>
    </div>
  </div>
);

export const DiscoverSkeletonGrid = () => (
  <div className="p-4 space-y-6">
    <div className="text-center space-y-2">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-64 mx-auto" />
    </div>
    
    <div className="flex justify-center">
      <ProfileCardSkeleton />
    </div>
  </div>
);

export const LikesSkeletonList = () => (
  <div className="p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
    </div>
    
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <LikeCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const MessagesSkeletonList = () => (
  <div className="bg-white">
    <div className="p-4 border-b border-gray-100">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
    </div>
    
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <MessageThreadSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const ForumSkeletonList = () => (
  <div className="p-4 space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-40" />
    
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
            </div>
            <div className="flex items-center space-x-4 pt-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);