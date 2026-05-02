/**
 * getTenantId Component
 * Extracts the tenant ID from the subdomain.
 * Returns null if on base domain (e.g., localhost).
 */
export const getTenantId = () => {
    const hostname = window.location.hostname;

    // For debugging: helpful to see what's being detected in the console
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Subdomain Detection] Hostname: ${hostname}`);
    }
    // Handle localhost and base domains
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null;
    }

    const parts = hostname.split('.');

    // Example: rbi.localhost -> parts: ['rbi', 'localhost']
    // Example: tenant1.example.com -> parts: ['tenant1', 'example', 'com']
    if (parts.length >= 2) {
        // If the last part is localhost (dev environment), the first part is the tenant
        if (parts[parts.length - 1] === 'localhost') {
            return parts[0];
        }

        // For standard multitenant domains like tenant.sitemonitor.app
        // we take the first part as the tenant ID
        return parts[0];
    }
    // Handle single-part hostnames that aren't localhost (e.g., mapped in hosts file)
    if (parts.length === 1) {
        return parts[0];
    }

    return null;
};
