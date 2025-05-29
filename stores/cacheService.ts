// Advanced Cache Service - Sophisticated caching with intelligent policies
// Provides multi-tier caching, compression, versioning, and analytics

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compress, decompress } from 'lz-string';

// Cache configuration types
export interface CacheConfig {
  maxSize: number;              // Maximum cache size in bytes
  defaultTTL: number;           // Default time-to-live in milliseconds
  compressionThreshold: number; // Compress data larger than this (bytes)
  enableAnalytics: boolean;     // Track cache performance metrics
  enableCompression: boolean;   // Enable LZ compression
  version: number;              // Cache schema version
}

// Cache entry metadata
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  size: number;
  compressed: boolean;
  version: number;
  priority: CachePriority;
  tags: string[];
}

export type CachePriority = 'critical' | 'high' | 'medium' | 'low';

// Cache statistics
export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  compressionRatio: number;
  averageAccessTime: number;
  cacheEfficiency: number;
  priorityDistribution: Record<CachePriority, number>;
}

// Cache operation result
export interface CacheResult<T = any> {
  success: boolean;
  data?: T;
  fromCache: boolean;
  metadata?: CacheMetadata;
  error?: string;
  performanceMs?: number;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024,  // 50MB
  defaultTTL: 60 * 60 * 1000,  // 1 hour
  compressionThreshold: 1024,  // 1KB
  enableAnalytics: true,
  enableCompression: true,
  version: 1
};

class AdvancedCacheService {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalSize: 0,
    entryCount: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    compressionRatio: 1,
    averageAccessTime: 0,
    cacheEfficiency: 0,
    priorityDistribution: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };
  private accessTimes: number[] = [];
  private initPromise: Promise<void> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Initialize cache service
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    console.log('🗄️ Initializing Advanced Cache Service');
    
    try {
      // Load cache metadata from storage
      await this.loadCacheMetadata();
      
      // Perform migration if needed
      await this.migrateCache();
      
      // Clean up expired entries
      await this.cleanupExpiredEntries();
      
      // Warm up critical cache entries
      await this.warmupCache();
      
      console.log('🗄️ Cache initialized successfully', this.stats);
    } catch (error) {
      console.error('🗄️ Cache initialization error:', error);
    }
  }

  // Get data from cache with multi-tier lookup
  async get<T>(key: string, options?: {
    skipMemory?: boolean;
    skipStorage?: boolean;
    updateAccessTime?: boolean;
  }): Promise<CacheResult<T>> {
    const startTime = Date.now();
    
    try {
      // Check memory cache first (hot tier)
      if (!options?.skipMemory) {
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && !this.isExpired(memoryEntry.metadata)) {
          this.recordCacheHit(memoryEntry, startTime);
          return {
            success: true,
            data: memoryEntry.data as T,
            fromCache: true,
            metadata: memoryEntry.metadata,
            performanceMs: Date.now() - startTime
          };
        }
      }

      // Check storage cache (warm tier)
      if (!options?.skipStorage) {
        const storageEntry = await this.getFromStorage<T>(key);
        if (storageEntry && !this.isExpired(storageEntry.metadata)) {
          // Promote to memory cache
          this.memoryCache.set(key, storageEntry);
          this.recordCacheHit(storageEntry, startTime);
          return {
            success: true,
            data: storageEntry.data,
            fromCache: true,
            metadata: storageEntry.metadata,
            performanceMs: Date.now() - startTime
          };
        }
      }

      // Cache miss
      this.recordCacheMiss();
      return {
        success: false,
        fromCache: false,
        error: 'Cache miss',
        performanceMs: Date.now() - startTime
      };

    } catch (error) {
      console.error('🗄️ Cache get error:', error);
      return {
        success: false,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performanceMs: Date.now() - startTime
      };
    }
  }

  // Set data in cache with intelligent storage
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      skipCompression?: boolean;
    }
  ): Promise<CacheResult<T>> {
    const startTime = Date.now();
    
    try {
      // Calculate data size
      const dataStr = JSON.stringify(data);
      const size = new Blob([dataStr]).size;
      
      // Create cache entry
      const metadata: CacheMetadata = {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (options?.ttl || this.config.defaultTTL),
        accessCount: 0,
        lastAccessedAt: Date.now(),
        size,
        compressed: false,
        version: this.config.version,
        priority: options?.priority || 'medium',
        tags: options?.tags || []
      };

      // Compress if needed
      let processedData: any = data;
      if (this.config.enableCompression && 
          !options?.skipCompression && 
          size > this.config.compressionThreshold) {
        processedData = compress(dataStr);
        metadata.compressed = true;
        metadata.size = new Blob([processedData]).size;
      }

      const entry: CacheEntry<T> = {
        key,
        data: processedData,
        metadata
      };

      // Check cache size and evict if needed
      await this.ensureCacheSpace(metadata.size);

      // Store in both memory and storage
      this.memoryCache.set(key, entry);
      await this.saveToStorage(key, entry);

      // Update statistics
      this.updatePriorityDistribution();
      
      return {
        success: true,
        data,
        fromCache: false,
        metadata,
        performanceMs: Date.now() - startTime
      };

    } catch (error) {
      console.error('🗄️ Cache set error:', error);
      return {
        success: false,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performanceMs: Date.now() - startTime
      };
    }
  }

  // Delete entry from cache
  async delete(key: string): Promise<boolean> {
    try {
      this.memoryCache.delete(key);
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(`cache_${key}`);
      } else {
        await AsyncStorage.removeItem(`cache_${key}`);
      }
      
      return true;
    } catch (error) {
      console.error('🗄️ Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache entries
  async clear(options?: { 
    keepTags?: string[]; 
    keepPriority?: CachePriority[] 
  }): Promise<void> {
    try {
      if (!options) {
        // Clear everything
        this.memoryCache.clear();
        
        if (Platform.OS === 'web') {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
          keys.forEach(key => localStorage.removeItem(key));
        } else {
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter(k => k.startsWith('cache_'));
          await AsyncStorage.multiRemove(cacheKeys);
        }
      } else {
        // Selective clear
        const entriesToKeep: string[] = [];
        
        this.memoryCache.forEach((entry, key) => {
          const keepByTag = options.keepTags?.some(tag => 
            entry.metadata.tags.includes(tag)
          );
          const keepByPriority = options.keepPriority?.includes(
            entry.metadata.priority
          );
          
          if (keepByTag || keepByPriority) {
            entriesToKeep.push(key);
          }
        });

        // Clear entries not in keep list
        const allKeys = Array.from(this.memoryCache.keys());
        for (const key of allKeys) {
          if (!entriesToKeep.includes(key)) {
            await this.delete(key);
          }
        }
      }

      // Reset stats
      this.resetStats();
      
    } catch (error) {
      console.error('🗄️ Cache clear error:', error);
    }
  }

  // Invalidate cache entries by tag
  async invalidateByTag(tag: string): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    this.memoryCache.forEach((entry, key) => {
      if (entry.metadata.tags.includes(tag)) {
        keysToInvalidate.push(key);
      }
    });

    for (const key of keysToInvalidate) {
      await this.delete(key);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const efficiency = this.stats.hitCount + this.stats.missCount > 0
      ? this.stats.hitCount / (this.stats.hitCount + this.stats.missCount)
      : 0;

    return {
      ...this.stats,
      cacheEfficiency: efficiency,
      averageAccessTime: this.calculateAverageAccessTime()
    };
  }

  // Private helper methods

  private async getFromStorage<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      let dataStr: string | null;
      
      if (Platform.OS === 'web') {
        dataStr = localStorage.getItem(`cache_${key}`);
      } else {
        dataStr = await AsyncStorage.getItem(`cache_${key}`);
      }

      if (!dataStr) return null;

      const entry = JSON.parse(dataStr) as CacheEntry<T>;
      
      // Decompress if needed
      if (entry.metadata.compressed && typeof entry.data === 'string') {
        const decompressed = decompress(entry.data);
        entry.data = JSON.parse(decompressed || '{}');
      }

      return entry;
    } catch (error) {
      console.error('🗄️ Storage get error:', error);
      return null;
    }
  }

  private async saveToStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const dataStr = JSON.stringify(entry);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(`cache_${key}`, dataStr);
      } else {
        await AsyncStorage.setItem(`cache_${key}`, dataStr);
      }

      this.stats.totalSize += entry.metadata.size;
      this.stats.entryCount++;
    } catch (error) {
      console.error('🗄️ Storage save error:', error);
    }
  }

  private isExpired(metadata: CacheMetadata): boolean {
    return Date.now() > metadata.expiresAt;
  }

  private recordCacheHit(entry: CacheEntry, startTime: number): void {
    entry.metadata.accessCount++;
    entry.metadata.lastAccessedAt = Date.now();
    this.stats.hitCount++;
    this.accessTimes.push(Date.now() - startTime);
  }

  private recordCacheMiss(): void {
    this.stats.missCount++;
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    if (this.stats.totalSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Implement LRU eviction with priority consideration
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => {
        // Prioritize by priority level first
        const priorityWeight = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1
        };
        
        const aPriority = priorityWeight[a[1].metadata.priority];
        const bPriority = priorityWeight[b[1].metadata.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Lower priority first
        }
        
        // Then by last access time
        return a[1].metadata.lastAccessedAt - b[1].metadata.lastAccessedAt;
      });

    // Evict entries until we have enough space
    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize) break;
      
      await this.delete(key);
      freedSpace += entry.metadata.size;
      this.stats.evictionCount++;
    }
  }

  private async loadCacheMetadata(): Promise<void> {
    try {
      let metadataStr: string | null;
      
      if (Platform.OS === 'web') {
        metadataStr = localStorage.getItem('cache_metadata');
      } else {
        metadataStr = await AsyncStorage.getItem('cache_metadata');
      }

      if (metadataStr) {
        const savedStats = JSON.parse(metadataStr);
        this.stats = { ...this.stats, ...savedStats };
      }
    } catch (error) {
      console.error('🗄️ Load metadata error:', error);
    }
  }

  private async saveCacheMetadata(): Promise<void> {
    try {
      const metadataStr = JSON.stringify(this.stats);
      
      if (Platform.OS === 'web') {
        localStorage.setItem('cache_metadata', metadataStr);
      } else {
        await AsyncStorage.setItem('cache_metadata', metadataStr);
      }
    } catch (error) {
      console.error('🗄️ Save metadata error:', error);
    }
  }

  private async migrateCache(): Promise<void> {
    // Implement cache migration logic when version changes
    console.log('🗄️ Checking cache migration...');
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const keysToDelete: string[] = [];
    
    this.memoryCache.forEach((entry, key) => {
      if (this.isExpired(entry.metadata)) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    console.log(`🗄️ Cleaned up ${keysToDelete.length} expired entries`);
  }

  private async warmupCache(): Promise<void> {
    // Preload critical data into cache
    console.log('🗄️ Warming up cache with critical data...');
  }

  private updatePriorityDistribution(): void {
    this.stats.priorityDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.memoryCache.forEach(entry => {
      this.stats.priorityDistribution[entry.metadata.priority]++;
    });
  }

  private calculateAverageAccessTime(): number {
    if (this.accessTimes.length === 0) return 0;
    
    const sum = this.accessTimes.reduce((a, b) => a + b, 0);
    return sum / this.accessTimes.length;
  }

  private resetStats(): void {
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      compressionRatio: 1,
      averageAccessTime: 0,
      cacheEfficiency: 0,
      priorityDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
    this.accessTimes = [];
  }

  // Periodic cleanup task
  startMaintenanceTask(intervalMs: number = 300000): void { // 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredEntries();
      await this.saveCacheMetadata();
    }, intervalMs);
  }
}

// Export singleton instance
export const cacheService = new AdvancedCacheService();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  cacheService.init().then(() => {
    cacheService.startMaintenanceTask();
  });
}