import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useBedrockPassport } from "@bedrock_org/passport";
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: number;
  orangeId: string;
  username: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UserGrowthData {
  date: string;
  count: number;
}

// Define a type for the Bedrock user
interface BedrockUser {
  id?: string;
  sub?: string;
  name?: string;
  email?: string;
  // ...other properties
}

export default function AdminPage() {
  const { user, isLoggedIn } = useBedrockPassport();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [growthStats, setGrowthStats] = useState<UserGrowthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  // States for admin toggle feature
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<'promote' | 'demote' | null>(null);
  const [currentUserOrangeId, setCurrentUserOrangeId] = useState<string>("");
  
  // All data fetching in one useEffect with caching
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) {
        // If not logged in, redirect to home
        setLocation('/');
        return;
      }
      
      try {
        // Get the orangeId from the user object
        // @ts-ignore - type is too complex to handle directly
        const orangeId = (user as any).sub || (user as any).id;
        if (!orangeId) {
          setLocation('/');
          return;
        }
        
        // Save current user's orangeId for admin operations
        setCurrentUserOrangeId(orangeId);
        
        // Check for cached admin status
        const cachedAdminStatus = sessionStorage.getItem(`adminStatus-${orangeId}`);
        let isUserAdmin = false;
        
        if (cachedAdminStatus !== null) {
          isUserAdmin = cachedAdminStatus === 'true';
          setIsAdmin(isUserAdmin);
        } else {
          // If not cached, check admin status from server
          const adminCheckResponse = await fetch(`/api/users/check-admin?orangeId=${orangeId}`);
          const adminData = await adminCheckResponse.json();
          
          isUserAdmin = !!adminData.isAdmin;
          setIsAdmin(isUserAdmin);
          
          // Cache the admin status
          sessionStorage.setItem(`adminStatus-${orangeId}`, isUserAdmin.toString());
        }
        
        // Redirect non-admin users
        if (!isUserAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges to view this page.",
            variant: "destructive"
          });
          setLocation('/');
          return;
        }
        
        setIsLoading(true);
        
        // Check for cached user data (valid for 30 seconds)
        const cachedUsers = sessionStorage.getItem('admin-users-data');
        const cachedUsersTimestamp = sessionStorage.getItem('admin-users-timestamp');
        const cachedStats = sessionStorage.getItem('admin-stats-data');
        const cachedStatsTimestamp = sessionStorage.getItem('admin-stats-timestamp');
        
        const now = Date.now();
        const cacheValidTime = 30 * 1000; // 30 seconds
        
        // Use cached user data if available and fresh
        if (cachedUsers && cachedUsersTimestamp && 
            (now - parseInt(cachedUsersTimestamp)) < cacheValidTime) {
          setUsers(JSON.parse(cachedUsers));
        } else {
          // Fetch all users
          const usersResponse = await fetch(`/api/admin/users?adminId=${orangeId}`);
          if (!usersResponse.ok) {
            throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
          }
          
          const usersData = await usersResponse.json();
          setUsers(usersData);
          
          // Cache the results
          sessionStorage.setItem('admin-users-data', JSON.stringify(usersData));
          sessionStorage.setItem('admin-users-timestamp', now.toString());
        }
        
        // Use cached stats if available and fresh
        if (cachedStats && cachedStatsTimestamp && 
            (now - parseInt(cachedStatsTimestamp)) < cacheValidTime) {
          setGrowthStats(JSON.parse(cachedStats));
        } else {
          // Fetch growth stats
          const statsResponse = await fetch(`/api/admin/stats/user-growth?adminId=${orangeId}`);
          if (!statsResponse.ok) {
            throw new Error(`Failed to fetch growth stats: ${statsResponse.statusText}`);
          }
          
          const statsData = await statsResponse.json();
          setGrowthStats(statsData);
          
          // Cache the results
          sessionStorage.setItem('admin-stats-data', JSON.stringify(statsData));
          sessionStorage.setItem('admin-stats-timestamp', now.toString());
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error in admin data fetching:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchAdminData();
  }, [user, toast, setLocation]);

  // Loading state
  if (isAdmin === null || isLoading) {
    return (
      <div className="container mx-auto py-8 text-center bg-black text-white">
        <h1 className="text-3xl font-bold mb-6 text-[#F37920]">Admin Dashboard</h1>
        <div className="animate-pulse text-[#F37920] mb-4">Loading dashboard data...</div>
        <div className="w-32 h-1 bg-gray-800 rounded-full relative overflow-hidden mx-auto">
          <div className="absolute top-0 left-0 h-full bg-[#F37920] animate-loading"></div>
        </div>
      </div>
    );
  }

  // Function to initiate the admin toggle process with confirmation
  const handleToggleAdmin = (user: User) => {
    setTogglingUser(user);
    setConfirmDialogAction(user.isAdmin ? 'demote' : 'promote');
    setShowConfirmDialog(true);
  };
  
  // Function to actually perform the admin toggle
  const performAdminToggle = async () => {
    if (!togglingUser) return;
    
    try {
      setIsTogglingAdmin(true);
      
      const response = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: togglingUser.id,
          makeAdmin: !togglingUser.isAdmin,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to toggle admin status: ${response.statusText}`);
      }
      
      const updatedUser = await response.json();
      
      // Update the users list with the updated user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      // Clear cached user data to force refresh on next load
      sessionStorage.removeItem('admin-users-data');
      
      toast({
        title: 'Success',
        description: `User ${updatedUser.username} is now ${updatedUser.isAdmin ? 'an admin' : 'a regular user'}.`,
        variant: 'default',
      });
      
      // If the current user changed their own status, update the session
      if (updatedUser.orangeId === currentUserOrangeId) {
        sessionStorage.setItem(`adminStatus-${currentUserOrangeId}`, updatedUser.isAdmin.toString());
      }
    } catch (err) {
      console.error('Error toggling admin status:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update admin status.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingAdmin(false);
      setShowConfirmDialog(false);
      setTogglingUser(null);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 text-center bg-black text-white">
        <h1 className="text-3xl font-bold mb-6 text-[#F37920]">Admin Dashboard</h1>
        <p className="text-red-500">Error loading admin data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 text-[#F37920]">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="mb-8">
        <TabsList className="mb-6 bg-gray-900 border-gray-800">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#F37920] data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#F37920] data-[state=active]:text-white">
            User Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          {/* User Growth Chart */}
          <Card className="mb-8 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-[#F37920]">User Growth</CardTitle>
              <CardDescription className="text-gray-400">New user signups per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={growthStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#333', 
                        border: '1px solid #555',
                        color: 'white' 
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Users" 
                      stroke="#F37920" 
                      activeDot={{ r: 8, fill: "#F37920" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          {/* Users Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-[#F37920]">All Users</CardTitle>
              <CardDescription className="text-gray-400">List of all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption className="text-gray-400">A list of all registered users in the system.</TableCaption>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">ID</TableHead>
                    <TableHead className="text-gray-300">Username</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Admin Status</TableHead>
                    <TableHead className="text-gray-300">Date Joined</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800">
                        <TableCell className="text-gray-300">{user.id}</TableCell>
                        <TableCell className="text-gray-300">{user.username}</TableCell>
                        <TableCell className="text-gray-300">{user.email || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{user.role || 'User'}</TableCell>
                        <TableCell className="text-gray-300">
                          {user.isAdmin ? 
                            <Badge variant="default" className="bg-[#F37920] hover:bg-[#F37920]">
                              Admin
                            </Badge> : 
                            <Badge variant="outline" className="text-gray-400 border-gray-600">
                              Regular User
                            </Badge>
                          }
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Only show toggle if not changing the current user */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleAdmin(user)}
                              className="border-gray-700 text-[#F37920] hover:text-white hover:bg-[#F37920] hover:border-[#F37920]"
                              disabled={isTogglingAdmin}
                            >
                              {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-gray-800">
                      <TableCell colSpan={7} className="text-center text-gray-400">No users found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Confirmation Dialog for Admin Toggle */}
              <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#F37920]">
                      {confirmDialogAction === 'promote' ? 'Promote to Admin' : 'Remove Admin Rights'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      {confirmDialogAction === 'promote' 
                        ? `Are you sure you want to give ${togglingUser?.username} admin privileges?` 
                        : `Are you sure you want to remove admin privileges from ${togglingUser?.username}?`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setTogglingUser(null);
                      }}
                      disabled={isTogglingAdmin}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[#F37920] hover:bg-[#E26910] text-white"
                      onClick={performAdminToggle}
                      disabled={isTogglingAdmin}
                    >
                      {isTogglingAdmin ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}