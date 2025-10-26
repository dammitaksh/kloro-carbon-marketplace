"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Star, Shield, Leaf, Award } from "lucide-react";
import BuyCreditsModal from "./components/buy-credits-modal";
import { useRealTimeData, realTimeData } from "@/lib/real-time-data";

type Credit = {
  id: string;
  serialNumber: string;
  batchId?: string;
  projectName: string | null;
  projectType: string | null;
  projectLocation: string | null;
  projectCountry: string | null;
  certificationStandard: string | null;
  registry: string | null; // Legacy compatibility
  pricePerCredit: string | number;
  status: string;
  listingType: string;
  vintageYear: number | null;
  qualityScore?: string;
  sustainabilityRating?: string;
  additionalityScore?: string;
  permanenceRisk?: string;
  sellerName?: string;
  sellerType?: string;
  aiReliabilityScore?: number;
  marketPosition?: string;
  impactScore?: number;
};

export default function MarketView() {
  const [open, setOpen] = useState<string | null>(null);
  const [price, setPrice] = useState([150, 1500]);
  const [buyFor, setBuyFor] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    projectType: '',
    certificationStandard: '',
    location: '',
    listingType: 'both' as 'direct_sale' | 'marketplace_pool' | 'both',
    sortBy: 'price' as 'price' | 'vintage' | 'quality' | 'type',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // Use new real-time data system
  const { data, loading, error } = useRealTimeData(
    'individual-credits',
    () => realTimeData.getAvailableCredits({
      ...filters,
      priceRange: [price[0], price[1]],
      limit: 50
    }),
    { 
      critical: true, 
      autoRefresh: true,
      cacheDuration: 30000 // 30 seconds
    }
  );
  
  const items: Credit[] = data?.credits || [];
  const marketStats = data?.marketStats;
  const lastUpdated = data?.timestamp ? new Date(data.timestamp) : null;

  // Manual refresh function that triggers real-time data update
  const handleRefresh = () => {
    // Force refresh the data
    realTimeData.fetchData(
      'individual-credits',
      () => realTimeData.getAvailableCredits({
        ...filters,
        priceRange: [price[0], price[1]],
        limit: 50
      }),
      { 
        critical: true, 
        autoRefresh: true,
        cacheDuration: 30000
      }
    );
  };
  
  // Update filters and trigger data refresh
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Enhanced reliability scoring using AI-computed scores
  const getReliabilityDisplay = (credit: Credit) => {
    const score = credit.aiReliabilityScore || 3.0;
    const stars = Math.floor(score);
    const hasHalf = score % 1 >= 0.5;
    
    return {
      score,
      stars,
      hasHalf,
      label: score >= 4.5 ? 'Excellent' : 
             score >= 4.0 ? 'Very Good' :
             score >= 3.5 ? 'Good' :
             score >= 3.0 ? 'Fair' : 'Basic'
    };
  };
  
  // Market position indicator
  const getMarketPositionColor = (position?: string) => {
    switch (position) {
      case 'excellent_value': return 'bg-green-100 text-green-800';
      case 'fair_value': return 'bg-yellow-100 text-yellow-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get certification standard display
  const getCertificationDisplay = (standard?: string) => {
    const displays = {
      'gold_standard': { name: 'Gold Standard', icon: Award, color: 'text-yellow-600' },
      'vcs': { name: 'VCS', icon: Shield, color: 'text-blue-600' },
      'cdm': { name: 'CDM', icon: Shield, color: 'text-green-600' },
      'vera': { name: 'VERa', icon: Shield, color: 'text-purple-600' }
    };
    
    return displays[standard as keyof typeof displays] || 
           { name: standard || 'Unknown', icon: Shield, color: 'text-gray-600' };
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carbon Credit Marketplace</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card className="lg:col-span-1 h-fit">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Filters</h3>
          <Select onValueChange={(value) => updateFilters({ projectType: value })}>
            <SelectTrigger><SelectValue placeholder="Project Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reforestation">Reforestation</SelectItem>
              <SelectItem value="afforestation">Afforestation</SelectItem>
              <SelectItem value="solar_energy">Solar Energy</SelectItem>
              <SelectItem value="wind_energy">Wind Energy</SelectItem>
              <SelectItem value="hydro_power">Hydro Power</SelectItem>
              <SelectItem value="waste_management">Waste Management</SelectItem>
              <SelectItem value="methane_capture">Methane Capture</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="apac">APAC</SelectItem>
              <SelectItem value="emea">EMEA</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => updateFilters({ certificationStandard: value })}>
            <SelectTrigger><SelectValue placeholder="Certification" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gold_standard">Gold Standard</SelectItem>
              <SelectItem value="vcs">VCS (Verra)</SelectItem>
              <SelectItem value="cdm">CDM</SelectItem>
              <SelectItem value="vera">VERa</SelectItem>
              <SelectItem value="aces">ACES</SelectItem>
              <SelectItem value="car">CAR</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Vintage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Price Range (₹/t)</div>
            <Slider min={0} max={2000} step={10} value={price} onValueChange={setPrice} />
            <div className="text-xs text-muted-foreground">₹{price[0]} - ₹{price[1]}</div>
          </div>
          <Select onValueChange={(value) => updateFilters({ listingType: value as any })}>
            <SelectTrigger><SelectValue placeholder="Listing Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">All Credits</SelectItem>
              <SelectItem value="direct_sale">Direct Sale Only</SelectItem>
              <SelectItem value="marketplace_pool">Marketplace Pool</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => updateFilters({ sortBy: value as any })}>
            <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="vintage">Vintage Year</SelectItem>
              <SelectItem value="quality">Quality Score</SelectItem>
              <SelectItem value="type">Project Type</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            placeholder="Search projects" 
            onChange={(e) => updateFilters({ location: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        {/* AI Recommendations Section */}
        {!loading && items.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-blue-100">
                  <span className="text-blue-700 text-sm font-medium">AI</span>
                </div>
                <h3 className="font-semibold text-blue-900">Recommended for You</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Top Picks:</strong> Based on your industry and requirements, we recommend:
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• <strong>Verified Sellers:</strong> Prioritize Gold Standard and Verra certified projects</div>
                  <div>• <strong>Nature-Based:</strong> Forestry projects offer co-benefits and reliability</div>
                  <div>• <strong>Price Range:</strong> ₹800-1,200/credit offers good value with quality</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading credits…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No credits available right now.</div>
          ) : (
            items.map((credit, index) => {
              const reliability = getReliabilityDisplay(credit);
              const certification = getCertificationDisplay(credit.certificationStandard ?? undefined);
              const CertIcon = certification.icon;
              
              // Enhanced AI-based recommendation logic
              const isRecommended = (credit.aiReliabilityScore ?? 0) >= 4.0 || 
                                   credit.marketPosition === 'excellent_value' ||
                                   (credit.impactScore ?? 0) >= 4.0;
              
              return (
                <Card key={credit.id} className={`flex flex-col relative ${
                  isRecommended ? 'border-emerald-200 bg-emerald-50/20' : ''
                } ${credit.marketPosition === 'premium' ? 'border-purple-200' : ''}`}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header with project name and badges */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {credit.projectName || "Untitled Project"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {isRecommended && (
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              AI Pick
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            getMarketPositionColor(credit.marketPosition)
                          }`}>
                            {credit.marketPosition === 'excellent_value' ? 'Great Value' :
                             credit.marketPosition === 'fair_value' ? 'Fair Price' :
                             credit.marketPosition === 'premium' ? 'Premium' : 'Standard'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${Number(credit.pricePerCredit).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">per credit</div>
                      </div>
                    </div>

                    {/* Certification and Reliability */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CertIcon className={`h-4 w-4 ${certification.color}`} />
                        <span className="text-sm font-medium">{certification.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${
                              i < reliability.stars ? 'fill-yellow-400 text-yellow-400' :
                              i === reliability.stars && reliability.hasHalf ? 'fill-yellow-200 text-yellow-400' :
                              'fill-gray-200 text-gray-200'
                            }`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          {reliability.label}
                        </span>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <span className="font-medium">
                          {credit.projectType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span className="font-medium">{credit.projectLocation || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vintage:</span>
                        <span className="font-medium">{credit.vintageYear || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Serial:</span>
                        <span className="font-mono text-xs">{credit.serialNumber}</span>
                      </div>
                    </div>

                    {/* Impact Score */}
                    {credit.impactScore && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span>Impact Score:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${(credit.impactScore / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{credit.impactScore}/5</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => setOpen(credit.id)}>
                        Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setBuyFor({
                          id: credit.id,
                          title: credit.projectName,
                          registry: credit.certificationStandard,
                          location: credit.projectLocation,
                          type: credit.projectType,
                          vintage: credit.vintageYear,
                          available: 1, // Individual credits
                          price: Number(credit.pricePerCredit),
                          serialNumber: credit.serialNumber
                        })}
                        className="flex-1"
                      >
                        Purchase Credit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Verification documents, methodology, MRV reports, and carbon sequestration graphs would appear here.</p>
            <p>AI Recommendations: Arunachal Forest (High co-benefit), Gujarat Solar (Low price), Meghalaya Reforestation (Gold Standard).</p>
          </div>
        </DialogContent>
      </Dialog>

      <BuyCreditsModal open={!!buyFor} onClose={() => setBuyFor(null)} project={buyFor} />
      </div>
    </div>
  );
}
