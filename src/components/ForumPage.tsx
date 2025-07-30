import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageCircle, Heart, Eye, User, Flag, ChevronDown, Trash2, ArrowLeft } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list'); // New view mode state
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
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          flair,
          author_id,
          created_at,
          likes_count,
          comments_count
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 9);

      if (error) throw error;

      // Get author profiles separately
      let postsWithLikes: ForumPost[] = [];
      if (data && data.length > 0) {
        const authorIds = data.map(post => post.author_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url, ms_subtype, location')
          .in('user_id', authorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Check which posts the user has liked
        const postIds = data.map(post => post.id);
        const { data: userLikes } = await supabase
          .from('forum_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
        
        postsWithLikes = data.map(post => {
          const author = profileMap.get(post.author_id);
          return {
            ...post,
            author: {
              first_name: author?.first_name || 'Unknown',
              last_name: author?.last_name || 'User',
              avatar_url: author?.avatar_url || null,
              ms_subtype: author?.ms_subtype || null,
              location: author?.location || null,
            },
            user_has_liked: likedPostIds.has(post.id)
          };
        });
      }

      if (reset) {
        setPosts(postsWithLikes);
        setOffset(10);
      } else {
        setPosts(prev => [...prev, ...postsWithLikes]);
        setOffset(prev => prev + 10);
      }

      setHasMore(data?.length === 10);
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

    try {
      const { error } = await supabase
        .from('forum_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1, user_has_liked: true }
          : post
      ));

      toast({
        title: "Post liked!",
        description: "Your like has been added."
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select(`
          id,
          content,
          author_id,
          post_id,
          created_at,
          likes_count
        `)
        .eq('post_id', postId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author profiles separately and check likes
      let commentsWithLikes: ForumComment[] = [];
      if (data && data.length > 0) {
        const authorIds = data.map(comment => comment.author_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', authorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Check which comments the user has liked
        const commentIds = data.map(comment => comment.id);
        const { data: userLikes } = await supabase
          .from('forum_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedCommentIds = new Set(userLikes?.map(like => like.comment_id) || []);
        
        commentsWithLikes = data.map(comment => {
          const author = profileMap.get(comment.author_id);
          return {
            ...comment,
            author: {
              first_name: author?.first_name || 'Unknown',
              last_name: author?.last_name || 'User',
              avatar_url: author?.avatar_url || null,
            },
            user_has_liked: likedCommentIds.has(comment.id)
          };
        });
      }

      setComments(commentsWithLikes);
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
      setShowProfileView(true);
    } catch (error) {
      console.error('Error loading profile:', error);
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

  const getFlairInfo = (flairValue: string) => {
    return FORUM_FLAIRS.find(f => f.value === flairValue) || FORUM_FLAIRS[0];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          {viewMode === 'detail' && selectedPost ? (
            // Detail view header with back button
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closePostDetail}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forum
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Post Details</h1>
                <p className="text-gray-600 text-sm">{selectedPost.title}</p>
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
                    className="hover:shadow-md transition-shadow cursor-pointer"
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
                            <div className="flex items-center gap-2">
                              <span 
                                className="font-medium cursor-pointer hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewProfile(post.author_id);
                                }}
                              >
                                {post.author.first_name} {post.author.last_name}
                              </span>
                              <Badge className={`text-xs ${flair.color}`}>
                                {flair.label}
                              </Badge>
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
                      <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              likePost(post.id);
                            }}
                            disabled={post.user_has_liked}
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
        ) : (
          // Post Detail View with Scrollable Comments
          selectedPost && (
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
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => viewProfile(selectedPost.author_id)}
                          >
                            {selectedPost.author.first_name} {selectedPost.author.last_name}
                          </span>
                          <Badge className={`text-xs ${getFlairInfo(selectedPost.flair).color}`}>
                            {getFlairInfo(selectedPost.flair).label}
                          </Badge>
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
                      disabled={selectedPost.user_has_liked}
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
          )
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