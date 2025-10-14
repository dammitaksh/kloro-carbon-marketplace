"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setRole } from "@/lib/role";

const buyerSchema = z.object({
  companyName: z.string().min(1, "Required"),
  industryType: z.string().min(1, "Required"),
  address: z.string().optional(),
  // Carbon calculation fields
  employeeCount: z.number().min(1, "Must have at least 1 employee"),
  annualRevenue: z.number().min(0, "Revenue must be positive"),
  energyConsumption: z.number().min(0, "Energy consumption must be positive"),
  businessTravelDistance: z.number().min(0, "Travel distance must be positive"),
});

const sellerSchema = z.object({
  firmName: z.string().min(1, "Required"),
  website: z.string().url().optional(),
  organizationType: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
  description: z.string().min(10, "Please provide at least 10 characters"),
});

type Role = "buyer" | "seller";

export default function OnboardingRolePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [role, setRoleState] = React.useState<Role | null>(null);

  React.useEffect(() => {
    if (!isPending && !session) router.replace("/sign-in");
  }, [isPending, session, router]);

const buyerForm = useForm<z.infer<typeof buyerSchema>>({
    resolver: zodResolver(buyerSchema),
    defaultValues: restoreDraft("buyer", {
      companyName: "",
      industryType: "",
      address: "",
      employeeCount: 1,
      annualRevenue: 0,
      energyConsumption: 0,
      businessTravelDistance: 0,
    }),
  });

const sellerForm = useForm<z.infer<typeof sellerSchema>>({
    resolver: zodResolver(sellerSchema),
    defaultValues: restoreDraft("seller", {
      firmName: "",
      website: "",
      organizationType: "",
      location: "",
      description: "",
    }),
  });

  const onSubmitBuyer = async (values: z.infer<typeof buyerSchema>) => {
    persistDraft("buyer", values);
    const res = await fetch("/api/onboard/buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      clearDraft("buyer");
      try { setRole("buyer"); } catch {}
      router.push("/buyer-dashboard");
    }
  };

  const onSubmitSeller = async (values: z.infer<typeof sellerSchema>) => {
    persistDraft("seller", values);
    const res = await fetch("/api/onboard/seller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      clearDraft("seller");
      try { setRole("seller"); } catch {}
      router.push("/seller-dashboard?tab=projects&onboarding=true");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-4">
      <Stepper step={role ? 3 : 2} />
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xl font-semibold">Tell us who you are</div>
            <div className="text-sm text-muted-foreground">Choose your role to continue onboarding.</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RoleCard label="Buyer" active={role === "buyer"} onClick={() => setRoleState("buyer")} />
            <RoleCard label="Seller" active={role === "seller"} onClick={() => setRoleState("seller")} />
          </div>
        </CardContent>
      </Card>

      {role === "buyer" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="text-base font-semibold">Company Details</div>
            <Form {...buyerForm}>
              <form onSubmit={buyerForm.handleSubmit(onSubmitBuyer)} className="space-y-6">
                {/* Basic Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={buyerForm.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={buyerForm.control} name="industryType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="energy">Energy</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={buyerForm.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl><Input placeholder="e.g. 123 Business St, City, Country" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                {/* Carbon Footprint Calculation */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-base font-semibold mb-2">Carbon Footprint Assessment</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Help us calculate your company's carbon footprint and recommend the right amount of carbon credits.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={buyerForm.control} name="employeeCount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Employees</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={buyerForm.control} name="annualRevenue" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Revenue (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1000"
                            placeholder="e.g. 1000000"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={buyerForm.control} name="energyConsumption" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Energy Consumption (kWh)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1000"
                            placeholder="e.g. 50000"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={buyerForm.control} name="businessTravelDistance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Business Travel (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1000"
                            placeholder="e.g. 25000"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => persistDraft("buyer", buyerForm.getValues())}>Save Draft</Button>
                  <Button type="submit">Calculate & Continue</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

{role === "seller" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="text-base font-semibold">Organization Details</div>
              <div className="text-sm text-muted-foreground">
                Tell us about your organization to get started with carbon credit projects.
              </div>
            </div>
            <Form {...sellerForm}>
              <form onSubmit={sellerForm.handleSubmit(onSubmitSeller)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={sellerForm.control} name="firmName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={sellerForm.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (optional)</FormLabel>
                      <FormControl><Input placeholder="https://example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={sellerForm.control} name="organizationType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
                            <SelectItem value="forestry">Forestry & Conservation</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="waste_management">Waste Management</SelectItem>
                            <SelectItem value="technology">Clean Technology</SelectItem>
                            <SelectItem value="consulting">Environmental Consulting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={sellerForm.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Location</FormLabel>
                      <FormControl><Input placeholder="e.g. California, USA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={sellerForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Description</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Describe your organization and the types of carbon credit projects you develop..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="border-t pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Next Steps</div>
                    <div className="text-sm text-blue-800">
                      After completing this form, you'll be guided to add your first carbon credit project and upload sustainability reports to calculate your credits.
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => persistDraft("seller", sellerForm.getValues())}>Save Draft</Button>
                  <Button type="submit">Create Organization & Continue</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoleCard({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-md border p-4 text-left hover:shadow transition ${active ? "border-emerald-500 bg-emerald-50" : ""}`}>
      <div className="text-base font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{label === "Buyer" ? "For companies purchasing credits" : "For project developers listing credits"}</div>
    </button>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Signup", "Role", "Details", "Dashboard"];
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`px-2 py-1 rounded border ${i < step ? "bg-emerald-50 border-emerald-300" : ""}`}>{s}</div>
          {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function persistDraft<T>(key: "buyer" | "seller", data: T) {
  try { localStorage.setItem(`onboarding_draft_${key}`, JSON.stringify(data)); } catch {}
}
function restoreDraft<T>(key: "buyer" | "seller", fallback: T): T {
  try { const v = localStorage.getItem(`onboarding_draft_${key}`); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function clearDraft(key: "buyer" | "seller") {
  try { localStorage.removeItem(`onboarding_draft_${key}`); } catch {}
}
