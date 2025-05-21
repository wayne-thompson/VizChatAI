import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Visualization } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

// Function to truncate long text
const truncate = (text: string | null | undefined, maxLength: number = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export default function Projects() {
  const { data: visualizations, isLoading, error } = useQuery<Visualization[]>({
    queryKey: ['/api/visualizations'],
    queryFn: () => apiRequest<Visualization[]>('/api/visualizations')
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">My Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full rounded-md mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          We couldn't load your visualizations. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link href="/">
          <Button>
            <i className="fas fa-plus mr-2"></i>
            New Visualization
          </Button>
        </Link>
      </header>

      {visualizations && visualizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizations.map((viz) => (
            <Card key={viz.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/visualization/${viz.id}`}>
                <CardHeader className="pb-2 cursor-pointer">
                  <CardTitle className="text-xl">
                    {viz.title || "Untitled Visualization"}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {viz.createdAt ? formatDistanceToNow(new Date(viz.createdAt), { addSuffix: true }) : ""}
                  </p>
                </CardHeader>
              </Link>
              <CardContent>
                <div className="h-40 bg-gray-100 rounded-md mb-4 overflow-hidden">
                  <img 
                    src={viz.imageBase64} 
                    alt={viz.title || "Visualization"} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {truncate(viz.description || viz.initialSummary, 120)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {viz.tags && viz.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {(!viz.tags || viz.tags.length === 0) && (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Link href={`/visualization/${viz.id}`}>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-eye mr-1"></i> View
                  </Button>
                </Link>
                <Link href={`/share/${viz.shareId}`}>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-share-alt mr-1"></i> Share
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mb-4 text-gray-400">
            <i className="fas fa-chart-pie text-5xl"></i>
          </div>
          <h3 className="text-xl font-medium mb-2">No visualizations yet</h3>
          <p className="text-gray-500 mb-6">
            Upload your first visualization to get started
          </p>
          <Link href="/">
            <Button>
              <i className="fas fa-upload mr-2"></i>
              Upload a Visualization
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}