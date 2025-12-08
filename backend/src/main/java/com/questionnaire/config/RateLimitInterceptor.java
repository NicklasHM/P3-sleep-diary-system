package com.questionnaire.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);
    
    private final ConcurrentHashMap<String, RateLimitConfig.RateLimitInfo> rateLimitMap;
    private final int maxRequests;
    private final long windowSize;

    public RateLimitInterceptor(
            ConcurrentHashMap<String, RateLimitConfig.RateLimitInfo> rateLimitMap,
            int maxRequests,
            long windowSize) {
        this.rateLimitMap = rateLimitMap;
        this.maxRequests = maxRequests;
        this.windowSize = windowSize;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String clientId = getClientIdentifier(request);
        
        RateLimitConfig.RateLimitInfo info = rateLimitMap.computeIfAbsent(
            clientId,
            k -> new RateLimitConfig.RateLimitInfo()
        );
        
        if (!info.isAllowed(maxRequests, windowSize)) {
            logger.warn("Rate limit exceeded for client: {}", clientId);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60"); // Retry after 60 seconds
            return false;
        }
        
        return true;
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Use IP address as identifier
        String ip = request.getRemoteAddr();
        
        // Handle X-Forwarded-For header for proxied requests
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            ip = forwardedFor.split(",")[0].trim();
        }
        
        return ip;
    }
}




