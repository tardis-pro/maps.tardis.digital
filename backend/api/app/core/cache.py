"""
Redis Caching Layer for Maps Platform API.

This module provides Redis-based caching for expensive operations
like geometry capability checks and metadata retrieval.
"""

import logging
import time
from functools import wraps
from typing import Any, Callable, Optional, TypeVar

import redis.asyncio as redis
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheConfig(BaseModel):
    """Configuration for cache behavior."""
    ttl_seconds: int = 300  # 5 minutes default
    max_size: int = 10000  # Max items in cache
    namespace: str = "maps"


class CacheStats(BaseModel):
    """Cache statistics for monitoring."""
    hits: int = 0
    misses: int = 0
    size: int = 0
    
    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


class RedisCache:
    """
    Redis-based caching layer with async support.
    
    Provides:
    - Automatic key prefixing
    - TTL management
    - Cache statistics
    - Connection pooling
    """
    
    def __init__(
        self,
        redis_url: Optional[str] = None,
        config: Optional[CacheConfig] = None,
    ):
        """
        Initialize the Redis cache.
        
        Args:
            redis_url: Redis connection URL (uses settings if not provided)
            config: Cache configuration
        """
        self.redis_url = redis_url or settings.REDIS_URL
        self.config = config or CacheConfig()
        self._client: Optional[redis.Redis] = None
        self._pool: Optional[redis.ConnectionPool] = None
        self._stats = CacheStats()
        self._prefix = f"{self.config.namespace}:cache:"
    
    async def connect(self) -> None:
        """Establish connection to Redis."""
        try:
            self._pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,
                decode_responses=True,
            )
            self._client = redis.Redis(connection_pool=self._pool)
            
            # Test connection
            await self._client.ping()
            logger.info(f"Redis cache connected: {self.redis_url}")
        except redis.RedisError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Continue without cache - graceful degradation
            self._client = None
    
    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
        if self._pool:
            await self._pool.disconnect()
        logger.info("Redis cache disconnected")
    
    def _make_key(self, key: str) -> str:
        """Create a prefixed cache key."""
        return f"{self._prefix}{key}"
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.
        
        Args:
            key: Cache key (without prefix)
        
        Returns:
            Cached value or None if not found
        """
        if not self._client:
            return None
        
        try:
            full_key = self._make_key(key)
            value = await self._client.get(full_key)
            
            if value:
                self._stats.hits += 1
                logger.debug(f"Cache HIT: {key}")
            else:
                self._stats.misses += 1
                logger.debug(f"Cache MISS: {key}")
            
            return value
        except redis.RedisError as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[int] = None,
    ) -> bool:
        """
        Set a value in cache.
        
        Args:
            key: Cache key (without prefix)
            value: Value to cache (will be JSON serialized)
            ttl_seconds: Time-to-live in seconds (uses config default if not provided)
        
        Returns:
            True if successful
        """
        if not self._client:
            return False
        
        try:
            import json
            
            full_key = self._make_key(key)
            ttl = ttl_seconds or self.config.ttl_seconds
            
            # Serialize value as JSON
            serialized = json.dumps(value, default=str)
            
            await self._client.setex(full_key, ttl, serialized)
            
            # Update cache size approximation
            self._stats.size += 1
            
            logger.debug(f"Cache SET: {key} (ttl={ttl}s)")
            return True
        except (redis.RedisError, json.JSONEncodeError) as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        if not self._client:
            return False
        
        try:
            full_key = self._make_key(key)
            result = await self._client.delete(full_key)
            
            # Update cache size statistic if key was actually deleted
            if result > 0:
                self._stats.size = max(0, self._stats.size - 1)
                logger.debug(f"Cache DELETE: {key}")
            
            return result > 0
        except redis.RedisError as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching a pattern.
        
        Useful for invalidating related cache entries.
        
        Uses SCAN instead of KEYS for production-safe iteration.
        KEYS is a blocking command that can cause latency spikes.
        
        Args:
            pattern: Key pattern to match
        
        Returns:
            Number of keys deleted
        """
        if not self._client:
            return 0
        
        try:
            full_pattern = self._make_key(pattern)
            
            # Use SCAN instead of KEYS for production-safe iteration
            # SCAN is non-blocking and works with large datasets
            deleted_count = 0
            async for key in self._client.scan_iter(match=full_pattern, count=100):
                await self._client.delete(key)
                deleted_count += 1
            
            # Update cache size statistic
            self._stats.size = max(0, self._stats.size - deleted_count)
            
            if deleted_count > 0:
                logger.info(f"Cache CLEAR: {pattern} ({deleted_count} keys)")
            
            return deleted_count
        except redis.RedisError as e:
            logger.error(f"Cache clear error: {e}")
            return 0
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        return self._stats
    
    async def health_check(self) -> bool:
        """Check Redis connection health."""
        if not self._client:
            return False
        
        try:
            await self._client.ping()
            return True
        except redis.RedisError:
            return False


# Global cache instance
_cache: Optional[RedisCache] = None


async def get_cache() -> RedisCache:
    """Get or create the global cache instance."""
    global _cache
    
    if _cache is None:
        _cache = RedisCache()
        await _cache.connect()
    
    return _cache


async def close_cache() -> None:
    """Close the global cache connection."""
    global _cache
    
    if _cache:
        await _cache.disconnect()
        _cache = None


def cached(
    key_builder: Callable[..., str],
    ttl_seconds: int = 300,
    prefix: str = "",
):
    """
    Decorator for caching function results.
    
    Args:
        key_builder: Function to build cache key from function arguments
        ttl_seconds: Cache TTL in seconds
        prefix: Additional key prefix
    
    Returns:
        Decorated function with caching
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            cache = await get_cache()
            
            # Build cache key
            if prefix:
                base_key = f"{prefix}:{key_builder(*args, **kwargs)}"
            else:
                base_key = key_builder(*args, **kwargs)
            
            # Try to get from cache
            cached_value = await cache.get(base_key)
            if cached_value is not None:
                import json
                return json.loads(cached_value)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache the result
            await cache.set(base_key, result, ttl_seconds)
            
            return result
        
        return wrapper
    return decorator


# Pre-configured cache decorators for common use cases
def cache_geometry_caps(ttl_seconds: int = 600):
    """
    Decorator for caching geometry capability checks.
    
    These are expensive operations that benefit from caching.
    """
    return cached(
        key_builder=lambda source_id: f"geom_caps:{source_id}",
        ttl_seconds=ttl_seconds,
        prefix="geometry",
    )


def cache_layer_metadata(ttl_seconds: int = 300):
    """
    Decorator for caching layer metadata.
    
    Layer metadata changes infrequently.
    """
    return cached(
        key_builder=lambda layer_id: f"layer_meta:{layer_id}",
        ttl_seconds=ttl_seconds,
        prefix="layer",
    )


def cache_project_stats(ttl_seconds: int = 120):
    """
    Decorator for caching project statistics.
    
    Project stats are expensive to compute.
    """
    return cached(
        key_builder=lambda project_id: f"proj_stats:{project_id}",
        ttl_seconds=ttl_seconds,
        prefix="project",
    )
