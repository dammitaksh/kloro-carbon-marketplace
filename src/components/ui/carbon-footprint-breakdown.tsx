"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Factory, 
  Zap, 
  Car, 
  Trash2, 
  Plane, 
  Building,
  Droplets,
  Leaf
} from "lucide-react";

interface EmissionCategory {
  category: string;
  amount: number; // in tCO2e
  percentage: number;
  icon: React.ElementType;
  description: string;
  color: string;
}

interface CarbonFootprintBreakdownProps {
  totalFootprint: number; // total tCO2e
  categories?: EmissionCategory[];
}

// Mock data - in real app this would come from the API based on report analysis
const defaultCategories: EmissionCategory[] = [
  {
    category: "Energy Consumption",
    amount: 245.8,
    percentage: 42,
    icon: Zap,
    description: "Electricity, heating, and cooling",
    color: "bg-yellow-500"
  },
  {
    category: "Transportation",
    amount: 156.3,
    percentage: 27,
    icon: Car,
    description: "Fleet vehicles and business travel",
    color: "bg-blue-500"
  },
  {
    category: "Manufacturing",
    amount: 98.7,
    percentage: 17,
    icon: Factory,
    description: "Production processes and materials",
    color: "bg-gray-500"
  },
  {
    category: "Business Travel",
    amount: 45.2,
    percentage: 8,
    icon: Plane,
    description: "Flights and accommodation",
    color: "bg-indigo-500"
  },
  {
    category: "Waste Management",
    amount: 23.1,
    percentage: 4,
    icon: Trash2,
    description: "Waste disposal and recycling",
    color: "bg-green-500"
  },
  {
    category: "Water Usage",
    amount: 11.9,
    percentage: 2,
    icon: Droplets,
    description: "Water consumption and treatment",
    color: "bg-cyan-500"
  }
];

export function CarbonFootprintBreakdown({ 
  totalFootprint, 
  categories = defaultCategories 
}: CarbonFootprintBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Total Footprint Summary */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Leaf className="h-8 w-8 text-blue-700" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-900">
                  {totalFootprint.toLocaleString()} tCO₂e
                </h3>
                <p className="text-blue-700">Total Annual Carbon Footprint</p>
                <p className="text-sm text-blue-600 mt-1">
                  Based on analysis of your sustainability reports
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-900">
                Industry Average: 620 tCO₂e
              </div>
              <div className="text-sm text-blue-600">
                You&apos;re 6% below average
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Emissions Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color.replace('bg-', 'bg-')} bg-opacity-20`}>
                      <IconComponent className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.category}</div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {category.amount.toLocaleString()} tCO₂e
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.percentage}% of total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={category.percentage} 
                  className="h-2" 
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-green-900">Reduction Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="p-2 rounded-full bg-yellow-100">
                <Zap className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-900">Switch to Renewable Energy</div>
                <div className="text-sm text-green-700">
                  Could reduce emissions by up to 180 tCO₂e annually (30% reduction)
                </div>
              </div>
              <div className="text-sm font-semibold text-green-800">-180 tCO₂e</div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="p-2 rounded-full bg-blue-100">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-900">Fleet Electrification</div>
                <div className="text-sm text-green-700">
                  Electric vehicles could reduce transport emissions by 60%
                </div>
              </div>
              <div className="text-sm font-semibold text-green-800">-94 tCO₂e</div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="p-2 rounded-full bg-green-100">
                <Building className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-900">Energy Efficiency Improvements</div>
                <div className="text-sm text-green-700">
                  LED lighting and smart HVAC systems
                </div>
              </div>
              <div className="text-sm font-semibold text-green-800">-35 tCO₂e</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <div className="text-sm font-medium text-green-900">
              Potential Total Reduction: 309 tCO₂e (53% of current footprint)
            </div>
            <div className="text-sm text-green-700">
              This would reduce your annual footprint to 272 tCO₂e
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}