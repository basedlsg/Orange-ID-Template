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
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        // Orange ID is stored in 'sub' or 'id'
        // @ts-ignore - type is too complex to handle directly
        const orangeId = (user as any).sub || (user as any).id;
        if (!orangeId) return;
        
        const response = await fetch(`/api/users/check-admin?orangeId=${orangeId}`);
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        
        if (!data.isAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges to view this page.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify admin status.",
          variant: "destructive"
        });
      }
    };
    
    checkAdminStatus();
  }, [user, toast]);
  
  // Fetch users data
  const { 
    data: users, 
    isLoading: usersLoading, 
    error: usersError 
  } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      if (!user) return [];
      // Orange ID is stored in 'sub' or 'id'
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) return [];
      
      const response = await fetch(`/api/admin/users?adminId=${orangeId}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
    enabled: !!user && isAdmin === true
  });
  
  // Fetch user growth statistics
  const { 
    data: growthStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['/api/admin/stats/user-growth'],
    queryFn: async () => {
      if (!user) return [];
      // Orange ID is stored in 'sub' or 'id'
      // @ts-ignore - type is too complex to handle directly
      const orangeId = (user as any).sub || (user as any).id;
      if (!orangeId) return [];
      
      const response = await fetch(`/api/admin/stats/user-growth?adminId=${orangeId}`);
      if (!response.ok) throw new Error('Failed to fetch user growth statistics');
      return response.json() as Promise<UserGrowthData[]>;
    },
    enabled: !!user && isAdmin === true
  });
  
  // If not logged in, redirect to home
  if (!user) {
    const [, setLocation] = useLocation();
    setLocation('/');
    return null;
  }
  
  // If checked and not admin, redirect to home
  if (isAdmin === false) {
    const [, setLocation] = useLocation();
    setLocation('/');
    return null;
  }

  // Loading state
  if (isAdmin === null || usersLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (usersError || statsError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-red-500">Error loading admin data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* User Growth Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user signups per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={growthStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Users" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>List of all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of all registered users in the system.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Date Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}