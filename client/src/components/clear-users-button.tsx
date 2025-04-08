import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function ClearUsersButton() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  
  const handleClearUsers = async () => {
    try {
      setIsClearing(true);
      
      // Call the API to clear all users
      const response = await fetch("/api/admin/clear-users", {
        method: "POST"
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "All users have been cleared. You will need to log in again.",
          variant: "default",
        });
        
        // Force page reload after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear users");
      }
    } catch (error) {
      console.error("Error clearing users:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while clearing users",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          Clear All Users
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Users</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all users from the database. This action cannot be undone.
            <br /><br />
            You will be logged out and will need to log in again. The first user to log in will become the admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearUsers}
            disabled={isClearing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isClearing ? "Clearing..." : "Yes, Clear All Users"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}