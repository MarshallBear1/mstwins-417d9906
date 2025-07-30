import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, TrendingUp, Plus } from "lucide-react";

const ForumPage = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
        <p className="text-gray-600">Connect, share, and support each other in our MS community</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Forum Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We're building an amazing forum experience where you can share your journey, 
            ask questions, and support fellow community members.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Discussion Topics</h3>
              <p className="text-xs text-gray-600 mt-1">Share experiences and tips</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Support Groups</h3>
              <p className="text-xs text-gray-600 mt-1">Find your support network</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <Plus className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Expert Q&A</h3>
              <p className="text-xs text-gray-600 mt-1">Get answers from professionals</p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500">
              In the meantime, connect with community members through our matching system!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPage;