/**
 * Real-Time Data Collection Algorithm
 * Handles efficient data fetching, caching, and real-time updates
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface LoaderState {
  isLoading: boolean;
  lastFetch: number;
  errorCount: number;
  retryAfter?: number;
}

class RealTimeDataManager {
  private cache = new Map<string, CacheEntry<any>>();
  private loaders = new Map<string, LoaderState>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private refreshIntervals = new Map<string, NodeJS.Timeout>();
  
  // Configuration
  private defaultCacheDuration = 30000; // 30 seconds (matches your current refresh)
  private criticalDataCacheDuration = 5000; // 5 seconds for critical data
  private maxRetries = 3;
  private backoffMultiplier = 1.5;

  /**
   * Algorithm for efficient data fetching with caching and error handling
   */
  async fetchData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      cacheDuration?: number;
      critical?: boolean;
      autoRefresh?: boolean;
      retryOnError?: boolean;
    } = {}
  ): Promise<T> {
    const {
      cacheDuration = this.defaultCacheDuration,
      critical = false,
      autoRefresh = true,
      retryOnError = true
    } = options;

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached && !this.shouldRefresh(key, critical)) {
      return cached;
    }

    // Check if already loading to prevent duplicate requests
    const loaderState = this.getLoaderState(key);
    if (loaderState.isLoading) {
      return this.waitForLoader<T>(key);
    }

    // Mark as loading
    this.setLoaderState(key, { 
      isLoading: true, 
      lastFetch: Date.now(),
      errorCount: loaderState.errorCount 
    });

    try {
      const data = await this.executeWithRetry(fetcher, key, retryOnError);
      
      // Cache the data
      this.setCache(key, data, cacheDuration);
      
      // Notify subscribers
      this.notifySubscribers(key, data);
      
      // Set up auto-refresh if needed
      if (autoRefresh) {
        this.setupAutoRefresh(key, fetcher, options);
      }
      
      // Reset loader state
      this.setLoaderState(key, { 
        isLoading: false, 
        lastFetch: Date.now(),
        errorCount: 0 
      });
      
      return data;
      
    } catch (error) {
      console.error(`Data fetch failed for ${key}:`, error);
      
      // Update error count and set retry delay
      const newErrorCount = loaderState.errorCount + 1;
      const retryDelay = Math.pow(this.backoffMultiplier, newErrorCount) * 1000;
      
      this.setLoaderState(key, {
        isLoading: false,
        lastFetch: Date.now(),
        errorCount: newErrorCount,
        retryAfter: Date.now() + retryDelay
      });
      
      // Return cached data if available, otherwise throw
      const fallbackCache = this.cache.get(key);
      if (fallbackCache) {
        console.warn(`Using cached data for ${key} due to fetch error`);
        return fallbackCache.data;
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to data updates for real-time components
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
          // Clean up auto-refresh if no subscribers
          const interval = this.refreshIntervals.get(key);
          if (interval) {
            clearInterval(interval);
            this.refreshIntervals.delete(key);
          }
        }
      }
    };
  }

  /**
   * Individual Credit Tracking Algorithm
   * Optimized for handling thousands of individual credits
   */
  async getAvailableCredits(filters: {
    projectType?: string;
    certificationStandard?: string;
    priceRange?: [number, number];
    location?: string;
    listingType?: 'direct_sale' | 'marketplace_pool' | 'both';
    limit?: number;
    offset?: number;
  } = {}) {
    const cacheKey = `credits:${JSON.stringify(filters)}`;
    
    return this.fetchData(
      cacheKey,
      async () => {
        const response = await fetch('/api/credits/individual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch credits: ${response.statusText}`);
        }
        
        return response.json();
      },
      {
        cacheDuration: this.defaultCacheDuration,
        critical: true, // Market data is critical
        autoRefresh: true
      }
    );
  }

  /**
   * Project Approval Workflow Data
   */
  async getProjectsByStatus(status: string, userRole: string) {
    const cacheKey = `projects:${status}:${userRole}`;
    
    return this.fetchData(
      cacheKey,
      async () => {
        const response = await fetch(`/api/projects/by-status?status=${status}&role=${userRole}`);
        return response.json();
      },
      {
        cacheDuration: 15000, // 15 seconds for project status
        autoRefresh: true
      }
    );
  }

  /**
   * Donation System Data
   */
  async getProjectDonations(projectId: string) {
    const cacheKey = `donations:${projectId}`;
    
    return this.fetchData(
      cacheKey,
      async () => {
        const response = await fetch(`/api/donations/project/${projectId}`);
        return response.json();
      },
      {
        cacheDuration: 60000, // 1 minute for donation data
        autoRefresh: false // Don't auto-refresh donation history
      }
    );
  }

  /**
   * Real-time Market Insights Algorithm
   */
  async getMarketInsights() {
    return this.fetchData(
      'market:insights',
      async () => {
        const response = await fetch('/api/market-insights');
        return response.json();
      },
      {
        cacheDuration: this.criticalDataCacheDuration,
        critical: true,
        autoRefresh: true
      }
    );
  }

  /**
   * User Profile Data with Role-based Optimization
   */
  async getUserProfile(userId: string, role: string) {
    const cacheKey = `profile:${userId}:${role}`;
    
    return this.fetchData(
      cacheKey,
      async () => {
        const response = await fetch(`/api/profile/${role}`);
        return response.json();
      },
      {
        cacheDuration: 120000, // 2 minutes for profile data
        autoRefresh: false
      }
    );
  }

  // Private helper methods

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    });
  }

  private shouldRefresh(key: string, critical: boolean): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    
    const age = Date.now() - entry.timestamp;
    const maxAge = critical ? this.criticalDataCacheDuration : this.defaultCacheDuration;
    
    return age > maxAge * 0.8; // Refresh when 80% of cache time has passed
  }

  private getLoaderState(key: string): LoaderState {
    return this.loaders.get(key) || {
      isLoading: false,
      lastFetch: 0,
      errorCount: 0
    };
  }

  private setLoaderState(key: string, state: LoaderState): void {
    this.loaders.set(key, state);
  }

  private async waitForLoader<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const checkLoader = () => {
        const state = this.getLoaderState(key);
        if (!state.isLoading) {
          const cached = this.getFromCache<T>(key);
          if (cached) {
            resolve(cached);
          } else {
            reject(new Error('Loader completed but no data available'));
          }
        } else {
          setTimeout(checkLoader, 100);
        }
      };
      
      setTimeout(checkLoader, 100);
    });
  }

  private async executeWithRetry<T>(
    fetcher: () => Promise<T>, 
    key: string, 
    retryOnError: boolean
  ): Promise<T> {
    const state = this.getLoaderState(key);
    
    if (!retryOnError || state.errorCount >= this.maxRetries) {
      return fetcher();
    }
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fetcher();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(this.backoffMultiplier, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private notifySubscribers<T>(key: string, data: T): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  private setupAutoRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: any
  ): void {
    // Clear existing interval
    const existingInterval = this.refreshIntervals.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Set up new interval
    const interval = setInterval(async () => {
      // Only refresh if there are subscribers
      if (this.subscribers.has(key) && this.subscribers.get(key)!.size > 0) {
        try {
          await this.fetchData(key, fetcher, { ...options, autoRefresh: false });
        } catch (error) {
          console.error(`Auto-refresh failed for ${key}:`, error);
        }
      }
    }, options.cacheDuration || this.defaultCacheDuration);
    
    this.refreshIntervals.set(key, interval);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();
    
    // Clear caches and subscribers
    this.cache.clear();
    this.subscribers.clear();
    this.loaders.clear();
  }
}

// Export singleton instance
export const realTimeData = new RealTimeDataManager();

import { useState, useEffect } from 'react';

// Export hooks for React components
export function useRealTimeData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: Parameters<typeof realTimeData.fetchData>[2]
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await realTimeData.fetchData(key, fetcher, options);
        
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Subscribe to updates
    const unsubscribe = realTimeData.subscribe<T>(key, (newData) => {
      if (mounted) {
        setData(newData);
        setError(null);
      }
    });
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key]);

  return { data, loading, error };
}

// Algorithm for Credit Purchase Optimization
export class CreditPurchaseOptimizer {
  static async findOptimalCredits(requirements: {
    quantity: number;
    maxPrice: number;
    preferredTypes: string[];
    certificationStandards: string[];
  }) {
    // AI-powered algorithm to find best credit combinations
    const availableCredits = await realTimeData.getAvailableCredits({
      priceRange: [0, requirements.maxPrice],
      limit: requirements.quantity * 3 // Get more options for optimization
    });
    
    // Score and sort credits based on requirements
    const scoredCredits = availableCredits.credits?.map((credit: any) => ({
      ...credit,
      score: this.calculateCreditScore(credit, requirements)
    })).sort((a: any, b: any) => b.score - a.score);
    
    // Select optimal combination
    return this.selectOptimalCombination(scoredCredits, requirements);
  }
  
  private static calculateCreditScore(credit: any, requirements: any): number {
    let score = 0;
    
    // Price scoring (lower is better)
    const priceScore = (requirements.maxPrice - parseFloat(credit.pricePerCredit)) / requirements.maxPrice;
    score += priceScore * 0.3;
    
    // Type preference scoring
    if (requirements.preferredTypes.includes(credit.type)) {
      score += 0.3;
    }
    
    // Certification scoring
    if (requirements.certificationStandards.includes(credit.registry)) {
      score += 0.2;
    }
    
    // Quality scoring (if available)
    if (credit.qualityScore) {
      score += (parseFloat(credit.qualityScore) / 5) * 0.2;
    }
    
    return score;
  }
  
  private static selectOptimalCombination(credits: any[], requirements: any) {
    // Simple greedy algorithm - can be enhanced with dynamic programming
    const selected = [];
    let totalQuantity = 0;
    let totalCost = 0;
    
    for (const credit of credits) {
      if (totalQuantity >= requirements.quantity) break;
      
      const canAdd = Math.min(
        credit.availableQuantity, 
        requirements.quantity - totalQuantity
      );
      
      if (canAdd > 0) {
        selected.push({
          ...credit,
          selectedQuantity: canAdd
        });
        
        totalQuantity += canAdd;
        totalCost += canAdd * parseFloat(credit.pricePerCredit);
      }
    }
    
    return {
      credits: selected,
      totalQuantity,
      totalCost,
      averagePrice: totalCost / totalQuantity
    };
  }
}