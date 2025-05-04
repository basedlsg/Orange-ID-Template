import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useBedrockPassport } from "@bedrock_org/passport";
import { useLocation } from "wouter";
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
  Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

export default function NatalChartPage() {
  const { isLoggedIn, user } = useBedrockPassport();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Query for birth data
  const birthDataQuery = useQuery<BirthData>({
    queryKey: ["/api/birth-data"],
    enabled: !!isLoggedIn,
  });

  // Query for natal chart
  const natalChartQuery = useQuery<NatalChart>({
    queryKey: ["/api/natal-chart"],
    enabled: !!isLoggedIn,
  });

  // Determine if we have birth data
  const hasBirthData = !!birthDataQuery.data;
  
  // Handling missing birth data
  const handleAddBirthData = () => {
    setLocation("/birth-data");
  };

  // Show loading state
  if (birthDataQuery.isLoading || natalChartQuery.isLoading) {
    return (
      <div className="container mx-auto py-10">
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

  // Show missing birth data state
  if (!hasBirthData) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-black border border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Your Natal Chart</CardTitle>
            <CardDescription>Birth information needed for your natal chart</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CalendarClock className="h-20 w-20 text-[#F37920] mb-4 opacity-70" />
            <h3 className="text-xl font-medium mb-2">Birth Information Required</h3>
            <p className="text-center text-gray-400 mb-6">
              To generate your natal chart and provide personalized astrological insights,
              we need your birth date, time, and location.
            </p>
            <Button 
              onClick={handleAddBirthData}
              className="bg-[#F37920] hover:bg-[#D86A10]"
            >
              Enter Birth Information
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if any
  if (birthDataQuery.error || natalChartQuery.error) {
    const error = birthDataQuery.error || natalChartQuery.error;
    return (
      <div className="container mx-auto py-10 px-4">
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
  if (hasBirthData && !natalChartQuery.data) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-black border border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-[#F37920]">Your Natal Chart</CardTitle>
            <CardDescription>Generate your astrological profile</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-6">
              <Sun className="h-16 w-16 text-[#F37920]" />
              <Moon className="h-10 w-10 text-gray-300 absolute -bottom-2 -right-2" />
            </div>
            <h3 className="text-xl font-medium mb-2">Natal Chart Not Found</h3>
            <p className="text-center text-gray-400 mb-6">
              You've provided your birth information, but your natal chart hasn't been generated yet.
              Connect with OpenAI to generate your personalized chart.
            </p>
            <Button 
              onClick={() => setLocation("/spiritual-discussions")}
              className="bg-[#F37920] hover:bg-[#D86A10]"
            >
              Go to Spiritual Discussions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // We have both birth data and natal chart
  const birthData = birthDataQuery.data as BirthData;
  const natalChart = natalChartQuery.data as NatalChart;

  // Format birth data for display
  const formattedBirthDate = birthData?.birthDate 
    ? new Date(birthData.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-black border border-gray-800 text-white mb-8">
        <CardHeader>
          <CardTitle className="text-[#F37920] text-2xl">Your Natal Chart</CardTitle>
          <CardDescription>
            Your personal astrological profile based on your birth information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Birth Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-400">Date:</span>
                <p>{formattedBirthDate}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Time:</span>
                <p>{birthData.birthTime || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Location:</span>
                <p>{birthData.birthLocation || 'Not provided'}</p>
              </div>
            </div>
            <div className="mt-2 text-right">
              <Button 
                variant="link" 
                onClick={handleAddBirthData}
                className="text-[#F37920] p-0 h-auto"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Primary Astrological Signs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Sun Sign */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Sun className="h-5 w-5 mr-2 text-yellow-500" />
                  Sun Sign
                </CardTitle>
                <CardDescription>Your core essence and identity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Badge className={`text-lg mr-2 ${getZodiacColor(natalChart.sunSign)}`}>
                    {getZodiacEmoji(natalChart.sunSign)}
                  </Badge>
                  <span className="text-xl font-semibold">{natalChart.sunSign || "Unknown"}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Element: {getZodiacElement(natalChart.sunSign)}
                </div>
              </CardContent>
            </Card>

            {/* Moon Sign */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Moon className="h-5 w-5 mr-2 text-blue-200" />
                  Moon Sign
                </CardTitle>
                <CardDescription>Your emotional nature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Badge className={`text-lg mr-2 ${getZodiacColor(natalChart.moonSign)}`}>
                    {getZodiacEmoji(natalChart.moonSign)}
                  </Badge>
                  <span className="text-xl font-semibold">{natalChart.moonSign || "Unknown"}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Element: {getZodiacElement(natalChart.moonSign)}
                </div>
              </CardContent>
            </Card>

            {/* Ascendant */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ArrowUp className="h-5 w-5 mr-2 text-purple-400" />
                  Ascendant
                </CardTitle>
                <CardDescription>Your social mask and approach to life</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <Badge className={`text-lg mr-2 ${getZodiacColor(natalChart.ascendantSign)}`}>
                    {getZodiacEmoji(natalChart.ascendantSign)}
                  </Badge>
                  <span className="text-xl font-semibold">{natalChart.ascendantSign || "Unknown"}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Element: {getZodiacElement(natalChart.ascendantSign)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Planetary Signs */}
          <h3 className="text-xl font-medium text-[#F37920] mb-4">Planetary Placements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {natalChart.mercurySign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Mercury in {natalChart.mercurySign}</h4>
                <p className="text-sm text-gray-400">Communication and intellect</p>
              </div>
            )}
            {natalChart.venusSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Venus in {natalChart.venusSign}</h4>
                <p className="text-sm text-gray-400">Love and values</p>
              </div>
            )}
            {natalChart.marsSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Mars in {natalChart.marsSign}</h4>
                <p className="text-sm text-gray-400">Energy and passion</p>
              </div>
            )}
            {natalChart.jupiterSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Jupiter in {natalChart.jupiterSign}</h4>
                <p className="text-sm text-gray-400">Growth and expansion</p>
              </div>
            )}
            {natalChart.saturnSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Saturn in {natalChart.saturnSign}</h4>
                <p className="text-sm text-gray-400">Discipline and challenges</p>
              </div>
            )}
          </div>

          {/* Outer Planets */}
          <h3 className="text-xl font-medium text-[#F37920] mb-4">Generational Influences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {natalChart.uranusSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Uranus in {natalChart.uranusSign}</h4>
                <p className="text-sm text-gray-400">Innovation and rebellion</p>
              </div>
            )}
            {natalChart.neptuneSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Neptune in {natalChart.neptuneSign}</h4>
                <p className="text-sm text-gray-400">Spirituality and dreams</p>
              </div>
            )}
            {natalChart.plutoSign && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium">Pluto in {natalChart.plutoSign}</h4>
                <p className="text-sm text-gray-400">Transformation and power</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Separator className="mb-4" />
          <Button 
            onClick={() => setLocation("/spiritual-discussions")}
            className="text-white bg-[#F37920] hover:bg-[#D86A10] mb-4"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Discuss Your Chart
          </Button>
          <p className="text-sm text-gray-400">
            Your natal chart is a snapshot of the sky at the moment of your birth.
            The positions of the planets and their relationships to each other influence your personality,
            strengths, challenges, and life path.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}