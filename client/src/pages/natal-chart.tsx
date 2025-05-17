import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "../hooks/useDebounce";
import { getOrangeId } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sun, 
  Moon, 
  ArrowUp, 
  MessageCircle,
  ChevronRight,
  CalendarClock,
  AlertCircle,
  Loader2,
  ChevronsUpDown,
  CheckIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import React, { FormEvent, ChangeEvent } from 'react';
import NatalChartWheel from '../components/NatalChartWheel';
import ChartSummary from '../components/ChartSummary';
import { NatalChartData } from '../../../shared/types';
import { City } from '../../../shared/schema';
import { useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Define interfaces for the data
interface BirthData {
  id: number;
  userId: number;
  birthDate: string;
  birthTime?: string;
  birthLocation?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  createdAt: string;
}

interface NatalChart {
  id: number;
  userId: number;
  sunSign?: string;
  moonSign?: string;
  ascendantSign?: string;
  mercurySign?: string;
  venusSign?: string;
  marsSign?: string;
  jupiterSign?: string;
  saturnSign?: string;
  uranusSign?: string;
  neptuneSign?: string;
  plutoSign?: string;
  houses?: string;
  aspects?: string;
  chartData?: string;
  lastUpdated: string;
}

// Helper function to get the zodiac sign emoji
function getZodiacEmoji(sign: string | null | undefined): string {
  if (!sign) return "⭐";

  const signLower = sign.toLowerCase();

  switch(signLower) {
    case "aries": return "♈";
    case "taurus": return "♉";
    case "gemini": return "♊";
    case "cancer": return "♋";
    case "leo": return "♌";
    case "virgo": return "♍";
    case "libra": return "♎";
    case "scorpio": return "♏";
    case "sagittarius": return "♐";
    case "capricorn": return "♑";
    case "aquarius": return "♒";
    case "pisces": return "♓";
    default: return "⭐";
  }
}

// Helper function to get colors for zodiac signs
function getZodiacColor(sign: string | null | undefined): string {
  if (!sign) return "bg-gray-700";

  const signLower = sign.toLowerCase();

  switch(signLower) {
    case "aries": return "bg-red-700";
    case "taurus": return "bg-green-700";
    case "gemini": return "bg-yellow-600";
    case "cancer": return "bg-blue-700";
    case "leo": return "bg-orange-600";
    case "virgo": return "bg-emerald-700";
    case "libra": return "bg-pink-700";
    case "scorpio": return "bg-purple-800";
    case "sagittarius": return "bg-amber-600";
    case "capricorn": return "bg-gray-600";
    case "aquarius": return "bg-cyan-700";
    case "pisces": return "bg-indigo-700";
    default: return "bg-gray-700";
  }
}

// Helper function to get zodiac sign element
function getZodiacElement(sign: string | null | undefined): string {
  if (!sign) return "Unknown";

  const signLower = sign.toLowerCase();

  switch(signLower) {
    case "aries":
    case "leo":
    case "sagittarius":
      return "Fire";
    case "taurus":
    case "virgo":
    case "capricorn":
      return "Earth";
    case "gemini":
    case "libra":
    case "aquarius":
      return "Air";
    case "cancer":
    case "scorpio":
    case "pisces":
      return "Water";
    default:
      return "Unknown";
  }
}

const apiClient = {
  getCities: async (): Promise<City[]> => {
    const response = await fetch('/api/cities');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch cities: ${response.status} ${errorText}`);
    }
    return response.json();
  },
  calculateNatalChart: async (payload: {
    birthDate: string;
    birthTime: string;
    cityId: number;
  }): Promise<NatalChartData> => {
    // Get orangeId from localStorage for authentication
    const orangeId = localStorage.getItem('orangeId');
    
    const response = await fetch('/api/natal-chart/calculate' + (orangeId ? `?orangeId=${orangeId}` : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        orangeId // Include in the body as well for maximum compatibility
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(errorData.message || `Failed to calculate natal chart: ${response.status}`);
    }
    return response.json();
  },
  getInterpretation: async (elementType: string, key: string): Promise<{ textContent: string } | null> => {
    if (!elementType || !key) return null; 
    const response = await fetch(`/api/interpretations?elementType=${encodeURIComponent(elementType)}&key=${encodeURIComponent(key)}`);
    if (response.status === 404) {
      return { textContent: 'Interpretation not found.' }; 
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch interpretation: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    // Map the response property to match what the component expects 
    return { textContent: data.textContent || data.text_content };
  },
};

const queryClient = new QueryClient();

const NatalChartPageContent: React.FC = () => {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [birthDate, setBirthDate] = useState<string>('');
  const [birthTime, setBirthTime] = useState<string>('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<NatalChartData | null>(null);

  // For Combobox with improved search performance
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedCityValue, setSelectedCityValue] = useState("");
  const [citySearchInput, setCitySearchInput] = useState("");
  
  // Get all cities but we'll filter them client-side for better performance
  const { data: allCities, isLoading: isLoadingCities, error: citiesError } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: apiClient.getCities,
  });
  
  // State for tracking if search is in progress
  const [isCitySearching, setIsCitySearching] = useState(false);
  
  // Use the custom debounce hook to debounce the search input
  const debouncedCitySearchTerm = useDebounce(citySearchInput, 350); // 350ms delay
  
  // Update the searching state when input changes
  useEffect(() => {
    // If search input is not empty and differs from debounced term, we're still searching
    if (citySearchInput && citySearchInput !== debouncedCitySearchTerm) {
      setIsCitySearching(true);
    } else {
      setIsCitySearching(false);
    }
  }, [citySearchInput, debouncedCitySearchTerm]);
  
  // Memoize filtered cities to avoid unnecessary re-filtering on every render
  const filteredCities = useMemo(() => {
    if (!allCities) {
      return []; // Return empty array if no cities loaded yet
    }
    
    if (!debouncedCitySearchTerm.trim()) {
      return allCities.slice(0, 50); // Show only first 50 if no search query for better performance
    }
    
    const lowerQuery = debouncedCitySearchTerm.toLowerCase().trim();
    return allCities
      .filter(city => 
        (city.name?.toLowerCase().includes(lowerQuery)) || 
        (city.country?.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 100); // Limit to 100 results for performance
  }, [allCities, debouncedCitySearchTerm]);

  const calculateChartMutation = useMutation<NatalChartData, Error, { birthDate: string; birthTime: string; cityId: number }>({
    mutationFn: (payload) => {
      console.log('[NatalChartPage] calculateChartMutation.mutateFn (apiClient.calculateNatalChart) called with payload:', payload);
      return apiClient.calculateNatalChart(payload);
    },
    onSuccess: (data) => {
      console.log('[NatalChartPage] calculateChartMutation onSuccess. Data received:', data);
      setChartData(data);
      
      // Also save the birth data for this user to prevent future 404 errors in deployment
      if (orangeId) {
        // Create request to save birth data so it persists for future sessions
        fetch('/api/birth-data?orangeId=' + encodeURIComponent(orangeId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate,
            birthTime: birthTime || '12:00',
            cityId,
            orangeId // Include orangeId in both query params and body for robustness
          })
        })
        .then(response => {
          if (response.ok) {
            console.log("Birth data saved successfully for future sessions");
          } else {
            console.warn("Failed to save birth data, but chart calculation was successful");
          }
        })
        .catch(err => {
          console.error("Error saving birth data:", err);
        });
      }
      
      toast({ title: "Natal Chart Calculated", description: "Your chart has been successfully generated." });
    },
    onError: (error) => {
      console.error('[NatalChartPage] calculateChartMutation onError:', error);
      toast({
        title: "Error Calculating Chart",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCalculateChart = (e: FormEvent) => {
    e.preventDefault();

    console.log('[NatalChartPage] handleCalculateChart triggered.');
    console.log('[NatalChartPage] Form values:', { birthDate, birthTime, cityId });

    if (!birthDate || cityId === null) {
      console.log('[NatalChartPage] Form validation failed. Missing data.');
      toast({
        title: "Missing Information",
        description: "Please provide a birth date and select a city.",
        variant: "destructive",
      });
      return;
    }
    
    // Use default time of noon (12:00) if birth time is not provided
    const calculationTime = birthTime || '12:00';
    console.log('[NatalChartPage] Form validation passed. Calling mutation with time:', calculationTime);
    
    calculateChartMutation.mutate({ 
      birthDate, 
      birthTime: calculationTime, 
      cityId 
    });
  };

  // Get orangeId from multiple sources for redundancy
  const typedUser = user as any;
  const orangeIdFromUser = typedUser?.sub || typedUser?.id;
  const storedOrangeId = getOrangeId();
  const orangeId = orangeIdFromUser || storedOrangeId;

  console.log("Natal chart using orangeId:", orangeId);

  // Query for birth data
  const birthDataQuery = useQuery<BirthData>({
    queryKey: ["/api/birth-data"],
    queryFn: async () => {
      if (!orangeId) {
        throw new Error("No authentication found. Please log in again.");
      }
      try {
        return await apiRequest(`/api/birth-data?orangeId=${orangeId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        // If birth data not found (404), we'll handle it gracefully
        if (error && (error as any).message && (error as any).message.includes('404')) {
          console.log("Birth data not found in database, will create form for input");
          return null;
        }
        throw error;
      }
    },
    enabled: !!isLoggedIn || !!orangeId,
    retry: false, // Don't retry on 404 errors
  });

  // Query for natal chart
  const natalChartQuery = useQuery<NatalChart>({
    queryKey: ["/api/natal-chart"],
    queryFn: async () => {
      if (!orangeId) {
        throw new Error("No authentication found. Please log in again.");
      }
      return apiRequest(`/api/natal-chart?orangeId=${orangeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
    },
    enabled: !!isLoggedIn || !!orangeId,
  });

  // Determine if we have birth data
  const hasBirthData = !!birthDataQuery.data;
  
  // Track if we're in deployment with missing birth data
  const isHandlingMissingData = birthDataQuery.isSuccess && birthDataQuery.data === null;

  // No longer redirecting to birth-data page
  const handleAddBirthData = () => {
    // Now handled directly on this page
    console.log("Birth data will be handled directly on the natal chart page");
    // No redirection, just focus on the form
    const birthDateInput = document.getElementById('birth-date-input');
    if (birthDateInput) {
      birthDateInput.focus();
    }
  };

  const pageContainerStyle: React.CSSProperties = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    // Subtle dark gradient background
    background: 'linear-gradient(180deg, #1a1a1a 0%, #101010 100%)', 
    minHeight: '100vh', // Ensure gradient covers full viewport height
    color: '#E0E0E0', // Default light text color for the page
  };

  const formContainerStyle: React.CSSProperties = {
    marginBottom: '30px', // Increased spacing below form/title block
    padding: '20px',
    backgroundColor: '#262626', // Slightly lighter card for form
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '15px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    color: '#b0b0b0',
    fontSize: '0.9em'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#E0E0E0',
    fontSize: '1em'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, // Inherit common input styles
    // any select-specific overrides if needed
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#E67E22', // Orange accent color
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: '#D35400', // Darker orange on hover
  };

  // State for button hover
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // Show loading state
  if (birthDataQuery.isLoading || natalChartQuery.isLoading || isLoadingCities) {
    return (
      <div style={pageContainerStyle}>
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Your Natal Chart</CardTitle>
            <CardDescription>Loading your astrological data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#F37920] animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle the case where birth data is missing - show birth data form directly instead of redirecting
  if (!hasBirthData || isHandlingMissingData) {
    // We'll enter birth data directly on this page
    // This handles both local environment and deployed environment cases where birth data is missing
    console.log("Showing birth data form - hasBirthData:", hasBirthData, "isHandlingMissingData:", isHandlingMissingData);
    return (
      <div style={pageContainerStyle}>
        <Card className="bg-black border border-gray-800 text-white mb-8">
          <CardHeader>
            <CardTitle className="text-[#F37920] text-2xl">Enter Birth Details for Your Natal Chart</CardTitle>
            <CardDescription>Your birth details are required to generate your personalized natal chart</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculateChart}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="birth-date-input" className="block text-sm font-medium text-gray-300 mb-1">Birth Date</label>
                  <input
                    id="birth-date-input"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter your birth date in YYYY-MM-DD format</p>
                </div>
                
                <div>
                  <label htmlFor="birth-time-input" className="block text-sm font-medium text-gray-300 mb-1">
                    Birth Time (optional)
                    <span className="text-gray-400 text-xs ml-2">Leave empty for noon (12:00 PM) chart</span>
                  </label>
                  <input
                    id="birth-time-input"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter your birth time in 24-hour format for more accurate readings</p>
                </div>
                
                <div>
                  <label htmlFor="city-selector" className="block text-sm font-medium text-gray-300 mb-1">Birth City</label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        onClick={() => setOpenCombobox(!openCombobox)}
                      >
                        {selectedCityValue || "Select city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                      <Command className="bg-gray-800">
                        <CommandInput 
                          placeholder="Search cities..." 
                          className="text-white" 
                          value={citySearchInput}
                          onValueChange={setCitySearchInput}
                        />
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {isLoadingCities ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-400">Loading cities...</span>
                              </div>
                            ) : isCitySearching ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-400">Searching...</span>
                              </div>
                            ) : citiesError ? (
                              <CommandItem className="text-red-500">
                                Error loading cities. Please try again.
                              </CommandItem>
                            ) : (
                              (filteredCities || []).map((city: City) => (
                                <CommandItem
                                  key={city.id}
                                  onSelect={() => {
                                    setCityId(city.id);
                                    setSelectedCityValue(`${city.name}, ${city.country}`);
                                    setOpenCombobox(false);
                                  }}
                                  className={cn(
                                    "flex items-center text-white",
                                    cityId === city.id ? "bg-gray-700" : ""
                                  )}
                                >
                                  <CheckIcon
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      cityId === city.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city.name}, {city.country}
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-400 mt-1">Select your birth city for accurate planetary positions</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-[#F37920] hover:bg-[#D86A10] text-white"
                  disabled={calculateChartMutation.isPending}
                >
                  {calculateChartMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate Natal Chart"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if any
  if (birthDataQuery.error || natalChartQuery.error) {
    const error = birthDataQuery.error || natalChartQuery.error;
    return (
      <div style={pageContainerStyle}>
        <Card className="bg-black border border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Your Natal Chart</CardTitle>
            <CardDescription>There was an error loading your astrological data</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-20 w-20 text-red-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">Error Loading Data</h3>
            <p className="text-center text-gray-400 mb-6">
              {error instanceof Error ? error.message : "An unknown error occurred. Please try again."}
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  birthDataQuery.refetch();
                  natalChartQuery.refetch();
                }}
              >
                Try Again
              </Button>
              <Button 
                onClick={handleAddBirthData}
                className="bg-[#F37920] hover:bg-[#D86A10]"
              >
                Update Birth Information
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have birth data but no natal chart, show missing chart state
  // THIS BLOCK IS REPLACED/REMOVED. The logic is moved to the main return for when hasBirthData is true.
  /*
  if (hasBirthData && !natalChartQuery.data) {
    // OLD CONTENT WAS HERE - NOW REMOVED
  }
  */

  // We have birthData if we've passed the earlier checks.
  // const birthData = birthDataQuery.data as BirthData; // This can be obtained inside the main return if needed
  // const natalChart = natalChartQuery.data as NatalChart; // This also handled in main return

  // Format birth data for display - can be done inside the main return where birthData is confirmed
  // const formattedBirthDate = birthData?.birthDate
  //   ? new Date(birthData.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  //   : 'Unknown';

  // The main return logic will now be more comprehensive for the hasBirthData case
  if (hasBirthData) {
    const currentBirthData = birthDataQuery.data as BirthData;
    const formattedBirthDateForDisplay = currentBirthData?.birthDate
      ? new Date(currentBirthData.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
      <div style={pageContainerStyle}>
      <Card className="bg-black border border-gray-800 text-white mb-8">
        <CardHeader>
            <CardTitle className="text-[#F37920] text-2xl">Calculate Your Natal Chart</CardTitle>
          <CardDescription>
              Enter or confirm your birth details below to generate your natal chart.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {/* Calculation Form */}
            <form onSubmit={handleCalculateChart}>
              <div style={inputGroupStyle}>
                <label htmlFor="birthDate" style={labelStyle}>Birth Date:</label>
                <input
                  type="date"
                  id="birthDate"
                  value={birthDate || (currentBirthData?.birthDate ? currentBirthData.birthDate.split('T')[0] : '')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#444] bg-[#1e1e1e] px-3 py-2 text-sm text-[#E0E0E0] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div style={inputGroupStyle}>
                <div className="flex justify-between">
                  <label htmlFor="birthTime" style={labelStyle}>Birth Time (optional):</label>
                  <span className="text-xs text-gray-400 mt-1">Leave empty for noon (12:00 PM) chart</span>
                </div>
                <input
                  type="time"
                  id="birthTime"
                  value={birthTime || (currentBirthData?.birthTime || '')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#444] bg-[#1e1e1e] px-3 py-2 text-sm text-[#E0E0E0] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div style={inputGroupStyle}>
                <label htmlFor="city" style={labelStyle}>Birth City:</label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between h-10 rounded-md border border-[#444] bg-[#1e1e1e] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{ color: selectedCityValue || cityId ? '#E0E0E0' : '#707070' }}
                    >
                      {selectedCityValue || 
                        (cityId && allCities 
                          ? (allCities.find(c => c.id === cityId)?.name + ", " + allCities.find(c => c.id === cityId)?.country) 
                          : "Select city...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1e1e1e] border border-[#444]" >
                    <Command className="bg-[#1e1e1e]">
                      <CommandInput 
                        placeholder="Search city..." 
                        className="h-9 text-[#E0E0E0] border-[#444] focus:ring-0 focus:border-[#E67E22]"
                      />
                      <CommandEmpty className="text-gray-400 p-2">No city found.</CommandEmpty>
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandGroup>
                          {isLoadingCities && <CommandItem className="text-gray-400">Loading cities...</CommandItem>}
                          {citiesError && <CommandItem className="text-red-500">Error loading cities.</CommandItem>}
                          {(filteredCities || []).map((city) => (
                            <CommandItem
                              key={city.id}
                              value={city.id.toString()} // Keep this as string for comparison with selectedCityValue
                              onSelect={(currentValue) => { // currentValue is city.id.toString()
                                const selected = filteredCities.find(c => c.id.toString() === currentValue);
                                if (selected) {
                                  setSelectedCityValue(currentValue); // Store the string ID
                                  setCityId(selected.id); // Store the number ID
                                  // Auto-fill date/time if empty and available from existing birthData
                                  if (!birthDate && currentBirthData?.birthDate) {
                                    setBirthDate(currentBirthData.birthDate.split('T')[0]);
                                  }
                                  if (!birthTime && currentBirthData?.birthTime) {
                                    setBirthTime(currentBirthData.birthTime);
                                  }
                                } else {
                                   setSelectedCityValue("");
                                   setCityId(null);
                                }
                                setOpenCombobox(false);
                              }}
                              className="text-[#E0E0E0] hover:bg-[#2f2f2f] aria-selected:bg-[#E67E22] aria-selected:text-white"
                            >
                              {city.name}, {city.country}
                              <CheckIcon
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedCityValue === city.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                type="submit"
                className="w-full mt-4 bg-[#E67E22] hover:bg-[#D35400] text-white"
                disabled={calculateChartMutation.isPending || !birthDate || !cityId}
              >
                {calculateChartMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating...</>
                ) : ( "Calculate Chart" )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {calculateChartMutation.isError && (
          <Card className="bg-red-900/30 border border-red-700 text-white mb-8 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Calculation Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{calculateChartMutation.error?.message || "An unexpected error occurred while calculating your chart. Please try again."}</p>
              <Button 
                onClick={() => calculateChartMutation.reset()}
                variant="outline" 
                className="mt-3 text-xs border-red-700 hover:bg-red-900/50"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Display newly calculated chart data */}
        {chartData && (
          <Card className="bg-black border border-gray-800 text-white mt-8">
            <CardHeader>
                <CardTitle className="text-[#F37920] text-2xl">Newly Calculated Natal Chart</CardTitle>
                {(!birthTime || birthTime === '12:00') && (
                  <CardDescription className="mt-2 text-amber-400 flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Time of birth was not provided; chart calculated for 12:00 PM. 
                    Moon, Ascendant, and House positions may not be accurate.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}> {/* Responsive flex direction removed for simplicity */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                   <NatalChartWheel chartData={chartData} />
                </div>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <ChartSummary chartData={chartData} getInterpretationFn={apiClient.getInterpretation} />
                </div>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Display existing natal chart if available and no new chart was just calculated */}
        {!chartData && natalChartQuery.data && (
          <Card className="bg-black border border-gray-800 text-white mt-8">
            <CardHeader>
              <CardTitle className="text-[#F37920] text-2xl">Your Saved Natal Chart</CardTitle>
              <CardDescription>
                This is your previously generated astrological profile.
              </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Birth Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><span className="text-sm text-gray-400">Date:</span><p>{formattedBirthDateForDisplay}</p></div>
                  <div><span className="text-sm text-gray-400">Time:</span><p>{currentBirthData.birthTime || 'Not provided'}</p></div>
                  <div><span className="text-sm text-gray-400">Location:</span><p>{currentBirthData.birthLocation || 'Not provided'}</p></div>
                </div>
                <div className="mt-2 text-right">
                  <Button variant="link" onClick={handleAddBirthData} className="text-[#F37920] p-0 h-auto">Edit Birth Info</Button>
                </div>
              </div>

              {/* Attempt to parse and display the saved chart data */}
              {(() => {
                try {
                  // Assuming natalChartQuery.data.chartData is the JSON string
                  if (natalChartQuery.data?.chartData) {
                    const parsedSavedChart = JSON.parse(natalChartQuery.data.chartData as string) as NatalChartData;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}> {/* Responsive flex direction removed for simplicity */}
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <NatalChartWheel chartData={parsedSavedChart} />
              </div>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <ChartSummary chartData={parsedSavedChart} getInterpretationFn={apiClient.getInterpretation} />
              </div>
              </div>
                    );
                  } else if (natalChartQuery.data) { 
                    // Fallback if chartData field is missing but we have some natalChart record.
                    // This might indicate a different structure or an incomplete saved chart.
                    // For now, we show primary signs if available directly on natalChartQuery.data object
                    const { sunSign, moonSign, ascendantSign } = natalChartQuery.data;
                    if (sunSign || moonSign || ascendantSign) {
                       return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {sunSign && <Card className="bg-gray-900 border-gray-700"><CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Sun className="h-5 w-5 mr-2 text-yellow-500" />Sun Sign</CardTitle></CardHeader><CardContent><div className="flex items-center mb-2"><Badge className={`text-lg mr-2 ${getZodiacColor(sunSign)}`}>{getZodiacEmoji(sunSign)}</Badge><span className="text-xl font-semibold">{sunSign}</span></div></CardContent></Card>}
                          {moonSign && <Card className="bg-gray-900 border-gray-700"><CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Moon className="h-5 w-5 mr-2 text-blue-200" />Moon Sign</CardTitle></CardHeader><CardContent><div className="flex items-center mb-2"><Badge className={`text-lg mr-2 ${getZodiacColor(moonSign)}`}>{getZodiacEmoji(moonSign)}</Badge><span className="text-xl font-semibold">{moonSign}</span></div></CardContent></Card>}
                          {ascendantSign && <Card className="bg-gray-900 border-gray-700"><CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><ArrowUp className="h-5 w-5 mr-2 text-purple-400" />Ascendant</CardTitle></CardHeader><CardContent><div className="flex items-center mb-2"><Badge className={`text-lg mr-2 ${getZodiacColor(ascendantSign)}`}>{getZodiacEmoji(ascendantSign)}</Badge><span className="text-xl font-semibold">{ascendantSign}</span></div></CardContent></Card>}
              </div>
                       );
                    }
                    return <p className="text-center text-gray-400">Saved chart data is incomplete or in an unexpected format.</p>;
                  }
                  return null; // Should not happen if natalChartQuery.data is present
                } catch (e) {
                  console.error("Error parsing saved chart data:", e);
                  return <p className="text-center text-red-500">Error displaying saved chart. Data might be corrupted.</p>;
                }
              })()}
            </CardContent>
          </Card>
            )}

        {!chartData && !natalChartQuery.data && (
           <Card className="bg-black border border-gray-800 text-white mt-8">
             <CardContent>
               <p className="text-center text-gray-400 py-8">
                 Your natal chart hasn't been generated yet. Please use the form above.
               </p>
             </CardContent>
           </Card>
        )}
      </div> // End of pageContainerStyle div
    );
  }

  // Fallback return for states not covered above (e.g., !hasBirthData, which is handled by earlier returns)
  // This should ideally be minimal as other states (loading, error, !hasBirthData) are already handled.
  return (
    <div style={pageContainerStyle}>
      <Card className="bg-black border border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-[#F37920]">Natal Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading your astrological information or awaiting birth data entry...</p>
          {!isLoggedIn && <p className="mt-4">Please log in to access your natal chart features.</p>}
        </CardContent>
      </Card>
    </div>
  );

}; // End of NatalChartPageContent

const NatalChartPage: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <NatalChartPageContent />
  </QueryClientProvider>
);

export default NatalChartPage;