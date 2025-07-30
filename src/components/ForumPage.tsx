import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageCircle, Heart, Eye, User, Flag, ChevronDown } from "lucide-react";
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
          comments_count,
          author:profiles!forum_posts_author_id_fkey(
            first_name,
            last_name,
            avatar_url,
            ms_subtype,
            location
          ),
          user_has_liked:forum_likes!left(id)
        `)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 9);

      if (error) throw error;

      const postsWithLikes = data?.map(post => ({
        ...post,
        user_has_liked: post.user_has_liked?.length > 0
      })) || [];

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
    if (!user || remainingLikes <= 0) {
      toast({
        title: "No likes remaining",
        description: "You've used all your likes for today. Try again tomorrow!",
        variant: "destructive"
      });
      return;
    }

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

      refreshRemainingLikes();
      toast({
        title: "Post liked!",
        description: `You have ${remainingLikes - 1} likes remaining today.`
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
          likes_count,
          author:profiles!forum_comments_author_id_fkey(
            first_name,
            last_name,
            avatar_url
          ),
          user_has_liked:forum_comment_likes!left(id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithLikes = data?.map(comment => ({
        ...comment,
        user_has_liked: comment.user_has_liked?.length > 0
      })) || [];

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

  const getFlairInfo = (flairValue: string) => {
    return FORUM_FLAIRS.find(f => f.value === flairValue) || FORUM_FLAIRS[0];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
            <p className="text-gray-600 text-sm">Connect, share, and support each other</p>
          </div>
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
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading && posts.length === 0 ? (
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
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="w-10 h-10 cursor-pointer" 
                          onClick={() => viewProfile(post.author_id)}
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
                              onClick={() => viewProfile(post.author_id)}
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
                          onClick={() => likePost(post.id)}
                          disabled={post.user_has_liked}
                          className={`gap-2 ${post.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            loadComments(post.id);
                          }}
                          className="gap-2 text-gray-500"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count}
                        </Button>
                      </div>
                      <span className="text-xs text-gray-400">
                        Likes remaining: {remainingLikes}
                      </span>
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
        )}
      </div>

      {/* Comments Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {/* Original Post */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{selectedPost.title}</h3>
                  <p className="text-gray-700">{selectedPost.content}</p>
                </CardContent>
              </Card>

              {/* Comments */}
              <ScrollArea className="h-[40vh]">
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.author.first_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author.first_name} {comment.author.last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  Post
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile View Dialog */}
      <ProfileViewDialog
        profile={selectedProfile}
        open={showProfileView}
        onOpenChange={setShowProfileView}
      />
    </div>
  );
};

export default ForumPage;