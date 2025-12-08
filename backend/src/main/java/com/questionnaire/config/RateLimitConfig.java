package com.questionnaire.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiting implementation
 * For production, consider using Redis-based rate limiting
 */
@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final long WINDOW_SIZE_MS = 60_000; // 1 minute

    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();

    @Bean
    public RateLimitInterceptor rateLimitInterceptor() {
        return new RateLimitInterceptor(rateLimitMap, MAX_REQUESTS_PER_MINUTE, WINDOW_SIZE_MS);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login", "/api/auth/register"); // Exclude auth endpoints
    }

    static class RateLimitInfo {
        private final AtomicInteger count = new AtomicInteger(0);
        private long windowStart;

        RateLimitInfo() {
            this.windowStart = System.currentTimeMillis();
        }

        boolean isAllowed(int maxRequests, long windowSize) {
            long now = System.currentTimeMillis();
            
            // Reset window if expired
            if (now - windowStart > windowSize) {
                count.set(0);
                windowStart = now;
            }
            
            // Check if limit exceeded
            if (count.get() >= maxRequests) {
                return false;
            }
            
            // Increment and allow
            count.incrementAndGet();
            return true;
        }
    }
}




