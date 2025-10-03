import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Visualization } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format, startOfDay, endOfDay } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

// Function to truncate long text
const truncate = (text: string | null | undefined, maxLength: number = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visualizationToDelete, setVisualizationToDelete] = useState<Visualization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: visualizations, isLoading, error } = useQuery<Visualization[]>({
    queryKey: ['/api/visualizations'],
    queryFn: () => apiRequest<Visualization[]>('/api/visualizations')
  });

  // Filter visualizations by date range
  const filteredVisualizations = useMemo(() => {
    if (!visualizations) return [];
    
    if (!dateRange?.from) return visualizations;
    
    const startDate = startOfDay(dateRange.from);
    const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    return visualizations.filter(viz => {
      const vizDate = new Date(viz.createdAt);
      return vizDate >= startDate && vizDate <= endDate;
    });
  }, [visualizations, dateRange]);

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === filteredVisualizations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVisualizations.map(v => v.id)));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      setIsDeleting(true);
      
      await apiRequest('/api/visualizations/bulk-delete', {
        method: 'POST',
        data: { ids: Array.from(selectedIds) }
      });
      
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.size} visualization(s)`,
      });
      
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/visualizations'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete visualizations",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to handle single project deletion
  const handleDeleteProject = async () => {
    if (!visualizationToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Call API to delete the visualization
      await apiRequest(`/api/visualizations/${visualizationToDelete.id}`, {
        method: 'DELETE'
      });
      
      // Show success message
      toast({
        title: "Visualization deleted",
        description: "The visualization has been successfully removed",
        variant: "default"
      });
      
      // Refresh the visualizations list
      queryClient.invalidateQueries({ queryKey: ['/api/visualizations'] });
    } catch (error) {
      // Show error message
      toast({
        title: "Error deleting visualization",
        description: "An error occurred while deleting the visualization",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setVisualizationToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Archive</h1>
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
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Archive</h1>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2" data-testid="button-date-filter">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
                    ) : (
                      format(dateRange.from, "PP")
                    )
                  ) : (
                    "Filter by date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  initialFocus
                />
                {dateRange?.from && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDateRange(undefined)}
                      data-testid="button-clear-date-filter"
                    >
                      Clear filter
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredVisualizations.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filteredVisualizations.length && filteredVisualizations.length > 0}
                onCheckedChange={selectAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-gray-600">
                Select all ({selectedIds.size} selected)
              </span>
            </div>
            
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                data-testid="button-delete-selected"
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt mr-2"></i>
                    Delete Selected ({selectedIds.size})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </header>

      {filteredVisualizations && filteredVisualizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisualizations.map((viz) => (
            <Card key={viz.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(viz.id)}
                  onCheckedChange={() => toggleSelection(viz.id)}
                  className="bg-white border-2"
                  data-testid={`checkbox-viz-${viz.id}`}
                />
              </div>
              
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
                  {viz.description ? truncate(viz.description, 120) : 
                   viz.initialSummary ? truncate(
                     (() => {
                       try {
                         const parsed = JSON.parse(viz.initialSummary);
                         return parsed.summary || viz.initialSummary;
                       } catch (e) {
                         return viz.initialSummary;
                       }
                     })(), 120) : 
                   "No description available"}
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
                <div className="flex gap-2">
                  <Link href={`/visualization/${viz.id}`}>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-eye mr-1"></i> View
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setVisualizationToDelete(viz);
                    }}
                  >
                    <i className="fas fa-trash-alt mr-1"></i> Delete
                  </Button>
                </div>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!visualizationToDelete} onOpenChange={(open) => !open && setVisualizationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this visualization?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the visualization
              and all associated data including analysis and chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Deleting...
                </>
              ) : (
                "Delete Visualization"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}