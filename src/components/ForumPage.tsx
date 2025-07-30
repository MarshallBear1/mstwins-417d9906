import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageCircle, Heart, Eye, User, Flag, ChevronDown, Trash2, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProfileViewDialog from "@/components/ProfileViewDialog";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  flair: string;
  author_id: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    ms_subtype: string | null;
    location: string | null;
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface ForumComment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  likes_count: number;
  user_has_liked: boolean;
}

const FORUM_FLAIRS = [
  { value: "general", label: "💬 General Discussion", color: "bg-gray-100 text-gray-700" },
  { value: "support", label: "🤝 Support & Advice", color: "bg-blue-100 text-blue-700" },
  { value: "symptoms", label: "🩺 Symptoms & Health", color: "bg-green-100 text-green-700" },
  { value: "treatment", label: "💊 Treatment & Medication", color: "bg-purple-100 text-purple-700" },
  { value: "lifestyle", label: "🌱 Lifestyle & Wellness", color: "bg-yellow-100 text-yellow-700" },
  { value: "success", label: "🎉 Success Stories", color: "bg-emerald-100 text-emerald-700" },
  { value: "research", label: "🔬 Research & News", color: "bg-indigo-100 text-indigo-700" },
  { value: "relationships", label: "❤️ Relationships & Dating", color: "bg-pink-100 text-pink-700" },
];

const ForumPage = () => {
  const { user } = useAuth();
  const { remainingLikes, refreshRemainingLikes } = useDailyLikes();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileView, setShowProfileView] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'profile'>('list'); // Add 'profile' mode
  const observerRef = useRef<IntersectionObserver>();
  const lastPostRef = useRef<HTMLDivElement>();

  // Create post form state
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    flair: "general"
  });

  const loadPosts = useCallback(async (reset = false) => {
    if (!user) return;

    try {
      const currentOffset = reset ? 0 : offset;
      const startTime = performance.now();
      
      // Optimized single query with joins to reduce API calls
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          flair,
          author_id,
          created_at,
          likes_count,
          comments_count,
          profiles!forum_posts_author_id_fkey (
            user_id,
            first_name,
            last_name,
            avatar_url,
            ms_subtype,
            location
          )
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 9);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        if (reset) {
          setPosts([]);
          setOffset(0);
        }
        setHasMore(false);
        return;
      }

      // Only fetch user likes separately (reduced from 3 queries to 2)
      const postIds = postsData.map(post => post.id);
      const { data: likesData } = await supabase
        .from('forum_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
      
      const postsWithLikes = postsData.map(post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        return {
          ...post,
          author: {
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'User',
            avatar_url: profile?.avatar_url || null,
            ms_subtype: profile?.ms_subtype || null,
            location: profile?.location || null,
          },
          user_has_liked: likedPostIds.has(post.id),
          profiles: undefined // Remove to clean up response
        };
      });

      if (reset) {
        setPosts(postsWithLikes);
        setOffset(10);
      } else {
        setPosts(prev => [...prev, ...postsWithLikes]);
        setOffset(prev => prev + 10);
      }

      setHasMore(postsData.length === 10);
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Forum posts loaded in ${loadTime.toFixed(2)}ms`);
      
      if (loadTime > 500) {
        console.warn(`⚠️ Slow forum query: ${loadTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error loading posts",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, offset, toast]);

  // Infinite scroll setup
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPosts();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadPosts]);

  useEffect(() => {
    loadPosts(true);
  }, [user]);

  const createPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          flair: newPost.flair,
          author_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community."
      });

      setNewPost({ title: "", content: "", flair: "general" });
      setShowCreatePost(false);
      loadPosts(true);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_has_liked) {
        // Unlike the post
        const { error } = await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: p.likes_count - 1, user_has_liked: false }
            : p
        ));

        // Update selected post if it's the current one
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, likes_count: prev.likes_count - 1, user_has_liked: false } : null);
        }

        toast({
          title: "Post unliked!",
          description: "Your like has been removed."
        });
      } else {
        // Like the post
        const { error } = await supabase
          .from('forum_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true }
            : p
        ));

        // Update selected post if it's the current one
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, likes_count: prev.likes_count + 1, user_has_liked: true } : null);
        }

        toast({
          title: "Post liked!",
          description: "Your like has been added."
        });
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const startTime = performance.now();
      
      // Optimized query with join to reduce API calls from 3 to 2
      const [commentsResult, likesResult] = await Promise.all([
        supabase
          .from('forum_comments')
          .select(`
            id,
            content,
            author_id,
            post_id,
            created_at,
            likes_count,
            profiles!forum_comments_author_id_fkey (
              user_id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('post_id', postId)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: true }),
        user ? supabase
          .from('forum_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id) : { data: [] }
      ]);

      if (commentsResult.error) throw commentsResult.error;

      const likedCommentIds = new Set(likesResult.data?.map(like => like.comment_id) || []);
      
      const commentsWithLikes: ForumComment[] = (commentsResult.data || []).map(comment => {
        const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
        return {
          ...comment,
          author: {
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'User',
            avatar_url: profile?.avatar_url || null,
          },
          user_has_liked: likedCommentIds.has(comment.id),
          profiles: undefined // Clean up response
        };
      });

      setComments(commentsWithLikes);
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Comments loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          content: newComment.trim(),
          post_id: selectedPost.id,
          author_id: user.id
        });

      if (error) throw error;

      setNewComment("");
      loadComments(selectedPost.id);
      
      // Update comments count
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      toast({
        title: "Comment added!",
        description: "Your comment has been posted."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const viewProfile = async (authorId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authorId)
        .single();

      if (error) throw error;

      setSelectedProfile(data);
      setViewMode('profile'); // Use card-based profile view
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id); // Ensure user can only delete their own posts

      if (error) throw error;

      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postId));

      toast({
        title: "Post deleted",
        description: "Your post has been removed from the forum."
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error deleting post",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const likeProfile = async (profileUserId: string) => {
    if (!user) return;

    try {
      // Check if we already liked this profile
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', profileUserId)
        .single();

      if (existingLike) {
        toast({
          title: "Already liked",
          description: "You've already liked this profile.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (error) throw error;

      toast({
        title: "Profile liked!",
        description: "Your like has been sent."
      });
    } catch (error) {
      console.error('Error liking profile:', error);
      toast({
        title: "Error liking profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes_count: comment.likes_count + 1, user_has_liked: true }
          : comment
      ));

      toast({
        title: "Comment liked!",
        description: "Your like has been added."
      });
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const openPostDetail = (post: ForumPost) => {
    setSelectedPost(post);
    setViewMode('detail');
    loadComments(post.id);
  };

  const closePostDetail = () => {
    setSelectedPost(null);
    setViewMode('list');
    setComments([]);
    setNewComment("");
  };

  const closeProfileView = () => {
    setSelectedProfile(null);
    setViewMode('list');
  };

  const getFlairInfo = (flairValue: string) => {
    return FORUM_FLAIRS.find(f => f.value === flairValue) || FORUM_FLAIRS[0];
  };

  const likeUserProfile = async (profileUserId: string) => {
    if (!user) return;

    // Prevent users from liking themselves
    if (user.id === profileUserId) {
      toast({
        title: "Can't like yourself",
        description: "You can't like your own profile!",
        variant: "destructive"
      });
      return;
    }

    // Check remaining likes
    if (remainingLikes <= 0) {
      toast({
        title: "No likes remaining",
        description: "You've used all your likes for today. Come back tomorrow!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if we already liked this profile
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user.id)
        .eq('liked_id', profileUserId)
        .single();

      if (existingLike) {
        toast({
          title: "Already liked",
          description: "You've already liked this profile.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: profileUserId
        });

      if (error) throw error;

      // Refresh remaining likes
      refreshRemainingLikes();

      toast({
        title: "Profile liked!",
        description: "Your like has been sent."
      });
    } catch (error) {
      console.error('Error liking profile:', error);
      toast({
        title: "Error liking profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          {(viewMode === 'detail' && selectedPost) || (viewMode === 'profile' && selectedProfile) ? (
            // Detail/Profile view header with back button
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={viewMode === 'detail' ? closePostDetail : closeProfileView}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forum
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {viewMode === 'detail' ? 'Post Details' : 'Profile'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {viewMode === 'detail' ? selectedPost?.title : `${selectedProfile?.first_name} ${selectedProfile?.last_name}`}
                </p>
              </div>
            </div>
          ) : (
            // List view header
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
              <p className="text-gray-600 text-sm">Connect, share, and support each other</p>
            </div>
          )}
          
          {viewMode === 'list' && (
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Flair</label>
                    <Select value={newPost.flair} onValueChange={(value) => setNewPost(prev => ({ ...prev, flair: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORUM_FLAIRS.map(flair => (
                          <SelectItem key={flair.value} value={flair.value}>
                            {flair.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What's on your mind?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts, experiences, or questions..."
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createPost} disabled={!newPost.title.trim() || !newPost.content.trim()}>
                      Post
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          // Posts List View
          loading && posts.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 space-y-4">
              {posts.map((post, index) => {
                const flair = getFlairInfo(post.flair);
                const isLast = index === posts.length - 1;
                
                return (
                  <Card 
                    key={post.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/20 border-2 border-transparent"
                    ref={isLast ? lastPostElementRef : null}
                    onClick={() => openPostDetail(post)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="w-10 h-10 cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewProfile(post.author_id);
                            }}
                          >
                            <AvatarImage src={post.author.avatar_url || undefined} />
                            <AvatarFallback>
                              {post.author.first_name[0]}{post.author.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="font-medium cursor-pointer hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewProfile(post.author_id);
                                }}
                              >
                                {post.author.first_name} {post.author.last_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewProfile(post.author_id);
                                  }}
                                >
                                  View Profile
                                </Button>
                                <Badge className={`text-xs ${flair.color}`}>
                                  {flair.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {post.author.ms_subtype && (
                                <span>{post.author.ms_subtype}</span>
                              )}
                              {post.author.location && (
                                <span>• {post.author.location}</span>
                              )}
                              <span>• {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                      <div className="text-xs text-primary/60 mb-2">Click to view full post and comments →</div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              likePost(post.id);
                            }}
                            className={`gap-2 ${post.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
                          >
                            <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                            {post.likes_count}
                          </Button>
                          <div className="flex items-center gap-2 text-gray-500">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </div>
                        </div>
                        {post.author_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePost(post.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {loading && posts.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>You've reached the end! 🎉</p>
                </div>
              )}
            </div>
          )
        ) : viewMode === 'profile' && selectedProfile ? (
          // Profile View (like matches page)
          <div className="max-w-2xl mx-auto p-4">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">User Profile</h2>
              <p className="text-muted-foreground">Connect with community members</p>
            </div>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-primary flex-shrink-0">
                    {selectedProfile.avatar_url ? (
                      <img
                        src={selectedProfile.avatar_url}
                        alt={`${selectedProfile.first_name}'s avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedProfile.first_name} {selectedProfile.last_name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedProfile.ms_subtype && (
                        <Badge className="bg-blue-100 text-blue-700">
                          {selectedProfile.ms_subtype}
                        </Badge>
                      )}
                      {selectedProfile.location && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          📍 {selectedProfile.location}
                        </Badge>
                      )}
                      {selectedProfile.diagnosis_year && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">
                          Diagnosed {selectedProfile.diagnosis_year}
                        </Badge>
                      )}
                    </div>

                    {selectedProfile.about_me && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedProfile.about_me}</p>
                      </div>
                    )}

                    {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.hobbies.slice(0, 8).map((hobby, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                              {hobby}
                            </Badge>
                          ))}
                          {selectedProfile.hobbies.length > 8 && (
                            <Badge variant="secondary" className="bg-gray-50 text-gray-600 text-xs">
                              +{selectedProfile.hobbies.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <Button 
                        className="flex-1 bg-gradient-primary hover:opacity-90 text-white" 
                        onClick={() => likeUserProfile(selectedProfile.user_id)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Like Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={closeProfileView}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Forum
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : viewMode === 'detail' && selectedPost ? (
          // Post Detail View with Scrollable Comments
          <div className="max-w-4xl mx-auto p-4">
            {/* Original Post */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer" 
                      onClick={() => viewProfile(selectedPost.author_id)}
                    >
                      <AvatarImage src={selectedPost.author.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedPost.author.first_name[0]}{selectedPost.author.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => viewProfile(selectedPost.author_id)}
                        >
                          {selectedPost.author.first_name} {selectedPost.author.last_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => viewProfile(selectedPost.author_id)}
                          >
                            View Profile
                          </Button>
                          <Badge className={`text-xs ${getFlairInfo(selectedPost.flair).color}`}>
                            {getFlairInfo(selectedPost.flair).label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {selectedPost.author.ms_subtype && (
                          <span>{selectedPost.author.ms_subtype}</span>
                        )}
                        {selectedPost.author.location && (
                          <span>• {selectedPost.author.location}</span>
                        )}
                        <span>• {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {selectedPost.author_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(selectedPost.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h1 className="font-bold text-2xl mb-4">{selectedPost.title}</h1>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{selectedPost.content}</p>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likePost(selectedPost.id)}
                    className={`gap-2 ${selectedPost.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${selectedPost.user_has_liked ? 'fill-current' : ''}`} />
                    {selectedPost.likes_count}
                  </Button>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    {selectedPost.comments_count} comments
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-lg">Comments</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment Form */}
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    Post
                  </Button>
                </div>

                {/* Scrollable Comments List */}
                <ScrollArea className="h-96">
                  <div className="space-y-3 pr-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar 
                            className="w-6 h-6 cursor-pointer"
                            onClick={() => viewProfile(comment.author_id)}
                          >
                            <AvatarImage src={comment.author.avatar_url || undefined} />
                            <AvatarFallback>
                              {comment.author.first_name[0]}{comment.author.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className="font-medium text-sm cursor-pointer hover:text-blue-600"
                            onClick={() => viewProfile(comment.author_id)}
                          >
                            {comment.author.first_name} {comment.author.last_name}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 px-1.5 text-xs ml-2"
                            onClick={() => viewProfile(comment.author_id)}
                          >
                            View
                          </Button>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeComment(comment.id)}
                          disabled={comment.user_has_liked}
                          className={`gap-1 text-xs ${comment.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
                        >
                          <Heart className={`w-3 h-3 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                          {comment.likes_count}
                        </Button>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Fallback for unknown view modes
          <div className="flex justify-center py-8">
            <p>Invalid view mode</p>
          </div>
        )}
      </div>

      {/* Profile View Dialog */}
      {selectedProfile && (
        <ProfileViewDialog
          profile={selectedProfile}
          open={showProfileView}
          onOpenChange={(open) => {
            setShowProfileView(open);
            if (!open) {
              setSelectedProfile(null);
            }
          }}
          showActions={true}
          onLike={() => likeProfile(selectedProfile.user_id)}
        />
      )}
    </div>
  );
};

export default ForumPage;