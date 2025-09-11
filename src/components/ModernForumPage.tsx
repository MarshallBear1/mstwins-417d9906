import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageCircle, Heart, Search, Filter, ArrowLeft, Users, Share, Bookmark, MoreHorizontal, Send } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

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
  { value: "general", label: "💬 General", color: "bg-gray-100 text-gray-700" },
  { value: "support", label: "🤝 Support", color: "bg-blue-100 text-blue-700" },
  { value: "symptoms", label: "🩺 Symptoms", color: "bg-green-100 text-green-700" },
  { value: "treatment", label: "💊 Treatment", color: "bg-purple-100 text-purple-700" },
  { value: "lifestyle", label: "🌱 Lifestyle", color: "bg-yellow-100 text-yellow-700" },
  { value: "success", label: "🎉 Success", color: "bg-emerald-100 text-emerald-700" },
  { value: "research", label: "🔬 Research", color: "bg-indigo-100 text-indigo-700" },
];

const ModernForumPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlair, setSelectedFlair] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Create post form state
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    flair: "general"
  });

  // Filter posts based on search and flair
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.first_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFlair = !selectedFlair || post.flair === selectedFlair;
    
    return matchesSearch && matchesFlair;
  });

  const getFlairInfo = (flairValue: string) => {
    return FORUM_FLAIRS.find(f => f.value === flairValue) || FORUM_FLAIRS[0];
  };

  const loadPosts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_forum_posts_with_authors_and_likes', {
          user_id_param: user.id,
          limit_count: 50
        });

      if (error) throw error;
      setPosts(data || []);
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
  }, [user, toast]);

  const handleCreatePost = async () => {
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
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('forum_likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_has_liked: !p.user_has_liked,
              likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handlePostClick = (post: ForumPost) => {
    setSelectedPost(post);
    setViewMode('detail');
    loadComments(post.id);
  };

  const loadComments = async (postId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_forum_comments_with_authors_and_likes', {
          post_id_param: postId,
          user_id_param: user.id
        });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
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
      
      // Update comment count
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error adding comment",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{
      paddingBottom: isMobile ? `max(6rem, ${safeAreaInsets.bottom + 80}px)` : '2rem'
    }}>
      {/* Post Detail View */}
      {viewMode === 'detail' && selectedPost && (
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewMode('list')} 
              className="flex items-center gap-2 text-primary hover:bg-primary/10 ios-bounce"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="ios-bounce">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="ios-bounce">
                <Share className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="ios-bounce">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedPost.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {selectedPost.author.first_name[0]}{selectedPost.author.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base">
                      {selectedPost.author.first_name} {selectedPost.author.last_name[0]}.
                    </span>
                    <Badge className={`${getFlairInfo(selectedPost.flair).color} text-xs px-2 py-1 rounded-full`}>
                      {getFlairInfo(selectedPost.flair).label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(selectedPost.created_at))} ago
                    {selectedPost.author.location && ` • ${selectedPost.author.location.split(',')[0]}`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <h1 className="text-xl font-bold mb-3 leading-tight">{selectedPost.title}</h1>
              <p className="text-gray-700 leading-relaxed mb-4">{selectedPost.content}</p>
              
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <button 
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors ios-bounce p-2"
                  onClick={() => handleLikePost(selectedPost.id)}
                >
                  <Heart className={`w-5 h-5 ${selectedPost.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="font-medium">{selectedPost.likes_count}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{selectedPost.comments_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 px-1">Comments</h2>
            
            {comments.map(comment => (
              <Card key={comment.id} className="bg-white rounded-xl shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                        {comment.author.first_name[0]}{comment.author.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author.first_name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at))} ago
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                      {comment.likes_count > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                          <span className="text-xs text-gray-500">{comment.likes_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Comment */}
            <Card className="bg-white rounded-xl shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                      {user?.user_metadata?.first_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] border-gray-200 rounded-xl resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-4 ios-bounce"
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Forum List View */}
      {viewMode === 'list' && (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Modern Header */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Community Forum</h1>
                    <p className="text-sm text-gray-500">{posts.length} active discussions</p>
                  </div>
                </div>
                <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 shadow-lg rounded-full px-6 ios-bounce">
                      <Plus className="w-4 h-4 mr-2" />
                      Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                        <Select value={newPost.flair} onValueChange={(value) => setNewPost(prev => ({ ...prev, flair: value }))}>
                          <SelectTrigger className="rounded-xl">
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
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                        <Input
                          placeholder="What's on your mind?"
                          value={newPost.title}
                          onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
                        <Textarea
                          placeholder="Share your thoughts with the community..."
                          value={newPost.content}
                          onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                          className="min-h-[120px] rounded-xl resize-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreatePost(false)}
                          className="flex-1 rounded-xl ios-bounce"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreatePost}
                          disabled={!newPost.title.trim() || !newPost.content.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl ios-bounce"
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <Button 
                  variant={selectedFlair ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSelectedFlair(selectedFlair ? null : "support")}
                  className="rounded-full px-4 ios-bounce"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              {/* Flair Filter Chips */}
              {selectedFlair && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {FORUM_FLAIRS.map((flair) => (
                    <Button
                      key={flair.value}
                      variant={selectedFlair === flair.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFlair(selectedFlair === flair.value ? null : flair.value)}
                      className="rounded-full whitespace-nowrap ios-bounce"
                    >
                      {flair.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Forum Posts */}
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <Card className="p-8 text-center bg-white rounded-2xl shadow-sm">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery || selectedFlair ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedFlair 
                    ? 'Try adjusting your search or filter settings'
                    : 'Be the first to start a conversation in the community!'}
                </p>
                {!searchQuery && !selectedFlair && (
                  <Button 
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-6 ios-bounce"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </Card>
            ) : (
              filteredPosts.map((post) => {
                const flair = getFlairInfo(post.flair);
                return (
                  <Card 
                    key={post.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-white rounded-2xl shadow-sm hover:shadow-lg ios-bounce active:scale-[0.98]"
                    onClick={() => handlePostClick(post)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={post.author.avatar_url || undefined} />
                            <AvatarFallback className="text-sm bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {post.author.first_name[0]}{post.author.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm truncate">
                                {post.author.first_name} {post.author.last_name[0]}.
                              </span>
                              {post.author.ms_subtype && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                                  {post.author.ms_subtype}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                              {post.author.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{post.author.location.split(',')[0]}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${flair.color} text-xs px-3 py-1 rounded-full flex-shrink-0`}>
                          {flair.label.split(' ')[0]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <h3 className="font-semibold text-base mb-3 hover:text-primary transition-colors leading-tight">{post.title}</h3>
                      <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <button 
                            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors ios-bounce p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikePost(post.id);
                            }}
                          >
                            <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="text-sm font-medium">{post.likes_count}</span>
                          </button>
                          <div className="flex items-center gap-2 text-gray-500">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{post.comments_count}</span>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Tap to read →</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernForumPage;
