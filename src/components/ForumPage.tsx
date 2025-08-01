import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageCircle, Heart, Eye, User, Flag, ChevronDown, ChevronUp, Trash2, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LikeLimitPopup from "@/components/LikeLimitPopup";
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
  top_comment?: {
    id: string;
    content: string;
    author_name: string;
    likes_count: number;
  } | null;
}

interface ForumComment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  parent_comment_id: string | null;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  likes_count: number;
  user_has_liked: boolean;
  replies?: ForumComment[];
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

// Helper function to find a comment by ID recursively
const findCommentById = (comments: ForumComment[], commentId: string): ForumComment | null => {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.replies) {
      const found = findCommentById(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
};

// Comment Thread Component for recursive rendering
interface CommentThreadProps {
  comment: ForumComment;
  depth: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onViewProfile: (userId: string) => void;
  onLikeComment: (commentId: string) => void;
  onReply: (commentId: string) => void;
  replyToComment: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  depth,
  isCollapsed,
  onToggleCollapse,
  onViewProfile,
  onLikeComment,
  onReply,
  replyToComment,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
}) => {
  const maxDepth = 5; // Limit nesting depth
  const hasReplies = comment.replies && comment.replies.length > 0;
  const bgColor = depth === 0 ? "bg-gray-50" : depth === 1 ? "bg-blue-50" : "bg-purple-50";
  const borderColor = depth === 0 ? "border-gray-200" : depth === 1 ? "border-blue-200" : "border-purple-200";
  
  return (
    <div className={`${depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''}`}>
      <div className={`p-3 ${bgColor} rounded-lg border-l-2 ${borderColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <Avatar 
            className={`${depth === 0 ? 'w-6 h-6' : 'w-5 h-5'} cursor-pointer`}
            onClick={() => onViewProfile(comment.author_id)}
          >
            <AvatarImage src={comment.author.avatar_url || undefined} />
            <AvatarFallback className={depth === 0 ? "text-xs" : "text-xs"}>
              {comment.author.first_name[0]}{comment.author.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <span 
            className={`font-medium ${depth === 0 ? 'text-sm' : 'text-xs'} cursor-pointer hover:text-blue-600`}
            onClick={() => onViewProfile(comment.author_id)}
          >
            {comment.author.first_name}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={`${depth === 0 ? 'h-5 px-1.5 text-xs ml-2' : 'h-4 px-1 text-xs ml-1'}`}
            onClick={() => onViewProfile(comment.author_id)}
          >
            View
          </Button>
          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-5 px-1 text-xs text-gray-500"
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {comment.replies?.length}
            </Button>
          )}
        </div>
        
        <p className={`${depth === 0 ? 'text-sm' : 'text-xs'} text-gray-700 mb-3`}>
          {comment.content}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLikeComment(comment.id)}
            disabled={comment.user_has_liked}
            className={`gap-1 ${depth === 0 ? 'text-xs' : 'text-xs'} ${comment.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`${depth === 0 ? 'w-3 h-3' : 'w-2 h-2'} ${comment.user_has_liked ? 'fill-current' : ''}`} />
            {comment.likes_count}
          </Button>
          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className={`${depth === 0 ? 'text-xs' : 'text-xs'} text-blue-600 hover:text-blue-700`}
            >
              Reply
            </Button>
          )}
        </div>
        
        {/* Reply Form */}
        {replyToComment === comment.id && (
          <div className="mt-3 flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              placeholder={`Reply to ${comment.author.first_name}...`}
              className={`flex-1 ${depth === 0 ? 'text-sm' : 'text-xs'}`}
            />
            <Button 
              size="sm"
              onClick={() => onSubmitReply(comment.id)} 
              disabled={!replyContent.trim()}
              className="text-xs px-3"
            >
              Reply
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={onCancelReply}
              className="text-xs px-2"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      {/* Nested Replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-2 space-y-2">
          {comment.replies!.map(reply => (
            <CommentThread 
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isCollapsed={false} // Individual replies don't have their own collapse state for simplicity
              onToggleCollapse={() => {}} // No-op for nested replies
              onViewProfile={onViewProfile}
              onLikeComment={onLikeComment}
              onReply={onReply}
              replyToComment={replyToComment}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showLikeLimitPopup, setShowLikeLimitPopup] = useState(false);
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());
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
      
      // Separate queries for better performance and reliability
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
          comments_count
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

      // Get unique author IDs for batch profile fetch
      const authorIds = [...new Set(postsData.map(post => post.author_id))];
      
      // Fetch profiles in batch
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, ms_subtype, location')
        .in('user_id', authorIds);

      // Create profile lookup map for O(1) access
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );
      // Get post IDs for additional queries
      const postIds = postsData.map(post => post.id);
      
      // Fetch user likes and top comments for each post
      const [likesResult, topCommentsResult] = await Promise.all([
        supabase
          .from('forum_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds),
        supabase
          .from('forum_comments')
          .select(`
            id,
            content,
            post_id,
            likes_count,
            author_id
          `)
          .eq('moderation_status', 'approved')
          .is('parent_comment_id', null)
          .in('post_id', postIds)
          .order('likes_count', { ascending: false })
          .order('created_at', { ascending: true })
      ]);

      const likedPostIds = new Set(likesResult.data?.map(like => like.post_id) || []);
      
      // Get author IDs for the top comments to fetch their names
      const commentAuthorIds = [...new Set((topCommentsResult.data || []).map(comment => comment.author_id))];
      
      // Fetch comment author profiles
      const { data: commentAuthorsData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', commentAuthorIds);

      const commentAuthorsMap = new Map(
        commentAuthorsData?.map(profile => [profile.user_id, profile]) || []
      );
      
      // Create a map of post_id to top comment
      const topCommentsMap = new Map();
      if (topCommentsResult.data) {
        topCommentsResult.data.forEach(comment => {
          if (!topCommentsMap.has(comment.post_id)) {
            const author = commentAuthorsMap.get(comment.author_id);
            topCommentsMap.set(comment.post_id, {
              id: comment.id,
              content: comment.content,
              author_name: author ? `${author.first_name} ${author.last_name}` : 'Unknown User',
              likes_count: comment.likes_count
            });
          }
        });
      }
      
      const postsWithLikes = postsData.map(post => {
        const profile = profilesMap.get(post.author_id);
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
          top_comment: topCommentsMap.get(post.id) || null,
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
        description: "Your post has been shared with the community and notifications sent."
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
            parent_comment_id,
            created_at,
            likes_count
          `)
          .eq('post_id', postId)
          .eq('moderation_status', 'approved')
          .order('likes_count', { ascending: false })
          .order('created_at', { ascending: true }),
        user ? supabase
          .from('forum_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id) : { data: [] }
      ]);

      if (commentsResult.error) throw commentsResult.error;

      const likedCommentIds = new Set(likesResult.data?.map(like => like.comment_id) || []);
      
      // Get unique author IDs for batch profile fetch
      const authorIds = [...new Set((commentsResult.data || []).map(comment => comment.author_id))];
      
      // Fetch profiles in batch
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', authorIds);

      // Create profile lookup map for O(1) access
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );
      
      const commentsWithLikes: ForumComment[] = (commentsResult.data || []).map(comment => {
        const profile = profilesMap.get(comment.author_id);
        return {
          ...comment,
          author: {
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'User',
            avatar_url: profile?.avatar_url || null,
          },
          user_has_liked: likedCommentIds.has(comment.id),
        };
      });

      // Organize comments into threads
      const threadsMap = new Map<string, ForumComment>();
      const topLevelComments: ForumComment[] = [];

      // First pass: create all comments
      commentsWithLikes.forEach(comment => {
        threadsMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into threads
      commentsWithLikes.forEach(comment => {
        const commentWithReplies = threadsMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = threadsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(commentWithReplies);
          }
        } else {
          topLevelComments.push(commentWithReplies);
        }
      });

      setComments(topLevelComments);
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Comments loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async (parentCommentId?: string) => {
    if (!user || !selectedPost) return;
    
    const content = parentCommentId ? replyContent.trim() : newComment.trim();
    if (!content) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          content: content,
          post_id: selectedPost.id,
          author_id: user.id,
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      if (parentCommentId) {
        setReplyContent("");
        setReplyToComment(null);
      } else {
        setNewComment("");
      }
      
      loadComments(selectedPost.id);
      
      // Update comments count
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      toast({
        title: parentCommentId ? "Reply added!" : "Comment added!",
        description: parentCommentId ? "Your reply has been posted." : "Your comment has been posted."
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

    const comment = findCommentById(comments, commentId);
    if (!comment || comment.user_has_liked) return;

    try {
      const { error } = await supabase
        .from('forum_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });

      if (error) throw error;

      // Update local state using the recursive helper function
      updateCommentLikes(commentId, comment.likes_count + 1, true);

      toast({
        title: "Comment liked!",
        description: "Your like has been added."
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error liking comment",
        description: "Please try again later.",
        variant: "destructive"
      });
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

  const toggleCommentCollapse = (commentId: string) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const updateCommentLikes = (commentId: string, likesCount: number, userHasLiked: boolean) => {
    const updateCommentRecursively = (comments: ForumComment[]): ForumComment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes_count: likesCount, user_has_liked: userHasLiked };
        }
        if (comment.replies) {
          return { ...comment, replies: updateCommentRecursively(comment.replies) };
        }
        return comment;
      });
    };
    
    setComments(prev => updateCommentRecursively(prev));
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
                className="flex items-center gap-1 text-xs h-7 px-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Forum
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {viewMode === 'detail' ? 'Post Details' : 'Profile'}
                </h1>
                <p className="text-gray-600 text-xs">
                  {viewMode === 'detail' ? selectedPost?.title : `${selectedProfile?.first_name} ${selectedProfile?.last_name}`}
                </p>
              </div>
            </div>
          ) : (
            // List view header
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
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
                             <div className="flex items-center gap-3">
                               <span 
                                 className="font-medium cursor-pointer hover:text-blue-600"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   viewProfile(post.author_id);
                                 }}
                               >
                                 {post.author.first_name}
                               </span>
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
                             </div>
                             <div className="mt-1">
                               <Badge className={`text-xs ${flair.color}`}>
                                 {flair.label}
                               </Badge>
                             </div>
                              <div className="mt-2 text-xs text-gray-500 italic">
                                sent {formatDistanceToNow(new Date(post.created_at))} ago
                              </div>
                           </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                      
                      {/* Top Comment Preview */}
                      {post.top_comment && (
                        <div className="bg-gray-50 border-l-4 border-blue-200 p-3 mb-4 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Top Comment</span>
                            <span className="text-xs text-gray-500">by {post.top_comment.author_name}</span>
                            {post.top_comment.likes_count > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                {post.top_comment.likes_count}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">"{post.top_comment.content}"</p>
                        </div>
                      )}
                      
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
          // Improved Profile View
          <div className="max-w-lg mx-auto p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Profile</h2>
              <p className="text-gray-600">Connect with community members</p>
            </div>
            
            <Card className="overflow-hidden shadow-xl rounded-3xl border-0 bg-white">
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="absolute inset-0 bg-black/10"></div>
                
                {/* Profile Avatar */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                    {selectedProfile.avatar_url ? (
                      <img
                        src={selectedProfile.avatar_url}
                        alt={`${selectedProfile.first_name}'s avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="pt-16 pb-6 px-6 text-center">
                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedProfile.first_name} {selectedProfile.last_name}
                </h3>
                
                {/* Tags */}
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                  {selectedProfile.ms_subtype && (
                    <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                      {selectedProfile.ms_subtype}
                    </Badge>
                  )}
                  {selectedProfile.location && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 text-sm px-3 py-1">
                      📍 {selectedProfile.location}
                    </Badge>
                  )}
                  {selectedProfile.diagnosis_year && (
                    <Badge className="bg-purple-100 text-purple-700 text-sm px-3 py-1">
                      Diagnosed {selectedProfile.diagnosis_year}
                    </Badge>
                  )}
                </div>

                {/* About */}
                {selectedProfile.about_me && (
                  <div className="mb-6 text-left">
                    <h4 className="font-semibold text-gray-900 mb-2 text-center">About</h4>
                    <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 rounded-lg p-3">
                      {selectedProfile.about_me}
                    </p>
                  </div>
                )}

                {/* Interests */}
                {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedProfile.hobbies.slice(0, 8).map((hobby, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                        >
                          {hobby}
                        </Badge>
                      ))}
                      {selectedProfile.hobbies.length > 8 && (
                        <Badge 
                          variant="secondary" 
                          className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full"
                        >
                          +{selectedProfile.hobbies.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <Button 
                    className="flex-1 max-w-36 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm h-10"
                    onClick={() => {
                      if (remainingLikes <= 0) {
                        setShowLikeLimitPopup(true);
                      } else {
                        likeUserProfile(selectedProfile.user_id);
                      }
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    <span className="truncate">Like</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeProfileView}
                    className="flex-1 max-w-36 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 text-sm h-10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="truncate">Back to Forum</span>
                  </Button>
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
                           {selectedPost.author.first_name}
                         </span>
                         <Button
                           variant="outline"
                           size="sm"
                           className="h-6 px-2 text-xs"
                           onClick={() => viewProfile(selectedPost.author_id)}
                         >
                           View Profile
                         </Button>
                       </div>
                       <div className="mt-1">
                         <Badge className={`text-xs ${getFlairInfo(selectedPost.flair).color}`}>
                           {getFlairInfo(selectedPost.flair).label}
                         </Badge>
                       </div>
                       <div className="bg-gray-100 rounded px-2 py-1 mt-2 text-xs text-gray-500">
                         Additional details available in profile
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
                  <Button onClick={() => addComment()} disabled={!newComment.trim()}>
                    Post
                  </Button>
                </div>

                {/* Scrollable Comments List */}
                <ScrollArea className="h-96">
                  <div className="space-y-3 pr-4">
                    {comments.map(comment => (
                      <CommentThread 
                        key={comment.id} 
                        comment={comment} 
                        depth={0}
                        isCollapsed={collapsedComments.has(comment.id)}
                        onToggleCollapse={() => toggleCommentCollapse(comment.id)}
                        onViewProfile={viewProfile}
                        onLikeComment={(commentId) => {
                          const comment = findCommentById(comments, commentId);
                          if (comment && !comment.user_has_liked) {
                            likeComment(commentId);
                          }
                        }}
                        onReply={(commentId) => setReplyToComment(commentId)}
                        replyToComment={replyToComment}
                        replyContent={replyContent}
                        onReplyContentChange={(content) => setReplyContent(content)}
                        onSubmitReply={(parentId) => addComment(parentId)}
                        onCancelReply={() => {
                          setReplyToComment(null);
                          setReplyContent("");
                        }}
                      />
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
          onLike={() => {
            if (remainingLikes <= 0) {
              setShowLikeLimitPopup(true);
            } else {
              likeProfile(selectedProfile.user_id);
            }
          }}
        />
      )}
      
      {/* Like limit popup */}
      <LikeLimitPopup 
        open={showLikeLimitPopup} 
        onOpenChange={setShowLikeLimitPopup} 
      />
    </div>
  );
};

export default ForumPage;