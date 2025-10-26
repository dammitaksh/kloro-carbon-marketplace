"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Overview from "./components/overview";
import Projects from "./components/projects";
import ListCredits from "./components/list-credits";
import MyListings from "./components/my-listings";
import Orders from "./components/orders";
import Revenue from "./components/revenue";
import Verification from "./components/verification";
import Insights from "./components/insights";
import SellerTransactions from "./components/transactions";
import AddProjectDialog from "./components/add-project-dialog";

export default function SellerDashboard() {
  const [tab, setTab] = React.useState<string>("overview");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openAdd, setOpenAdd] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const q = searchParams.get("tab") ?? "overview";
    const isOnboarding = searchParams.get("onboarding") === "true";
    setTab(q);
    setShowOnboarding(isOnboarding);
    
    // If it's onboarding and they're on projects tab, show the add project dialog
    if (isOnboarding && q === "projects") {
      setTimeout(() => setOpenAdd(true), 500);
    }
  }, [searchParams]);

  const onChange = (value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", value);
    router.push(`/seller-dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {showOnboarding && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">✓</div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 mb-1">Welcome to your Seller Dashboard!</div>
                <div className="text-sm text-green-800 mb-3">
                  You&apos;ve successfully created your organization profile. To start selling carbon credits, you&apos;ll need to:
                </div>
                <div className="space-y-1 text-sm text-green-800">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    <span><strong>Add a project</strong> - Create your first carbon credit project</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    <span><strong>Upload reports</strong> - Add sustainability reports to calculate credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    <span><strong>List credits</strong> - Make your credits available for purchase</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" onClick={() => setOpenAdd(true)}>Add Your First Project</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowOnboarding(false)}>Dismiss</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs value={tab} onValueChange={onChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="list">List Credits</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" onClick={()=>setOpenAdd(true)}>Add Project</Button>
            <Button onClick={()=>setTab("list")}>List Credits</Button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="projects" className="mt-4"><Projects /></TabsContent>
        <TabsContent value="list" className="mt-4"><ListCredits /></TabsContent>
        <TabsContent value="listings" className="mt-4"><MyListings /></TabsContent>
        <TabsContent value="orders" className="mt-4"><Orders /></TabsContent>
        <TabsContent value="transactions" className="mt-4"><SellerTransactions /></TabsContent>
        <TabsContent value="revenue" className="mt-4"><Revenue /></TabsContent>
        <TabsContent value="verification" className="mt-4"><Verification /></TabsContent>
        <TabsContent value="insights" className="mt-4"><Insights /></TabsContent>
      </Tabs>

      {/* Mobile quick actions */}
      <Card className="md:hidden">
        <CardContent className="p-3 flex gap-2">
          <Button className="flex-1" variant="outline" onClick={()=>setOpenAdd(true)}>Add Project</Button>
          <Button className="flex-1" onClick={()=>setTab("list")}>List Credits</Button>
        </CardContent>
      </Card>

      <AddProjectDialog open={openAdd} onClose={()=>setOpenAdd(false)} />
    </div>
  );
}
