import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
    private readonly ttl = Number(process.env.CACHE_TTL) || 3600;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    set(key: string, value: any, ttl?: number): Promise<any> {
        if (!ttl) {
            ttl = this.ttl;
        }
        return this.cacheManager.set(key, value, ttl);
    }

    get(key: string) {
        return this.cacheManager.get(key);
    }

    delete(key: string) {
        return this.cacheManager.del(key);
    }

    // reset() {
    //     return this.cacheManager.reset()
    // }
}