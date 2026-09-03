import ipaddr from "ipaddr.js";

/**
 * Derives the rate-limit bucket key for a client address.
 *
 * An IPv6 client gets a /64 key. A carrier assigns one /64 per subscriber, and a
 * device rotates addresses inside that /64 with privacy extensions. A /128 key
 * therefore gives one client an unlimited supply of buckets.
 *
 * An IPv4-mapped address unwraps to its IPv4 form first. Every IPv4-mapped
 * address shares the same first 8 bytes, so a /64 key would put all IPv4 clients
 * into one bucket.
 */
export const rateLimitKey = (ip: string): string => {
    try {
        const address = ipaddr.parse(ip);

        if (address.kind() === "ipv6") {
            const v6 = address as ipaddr.IPv6;

            if (v6.isIPv4MappedAddress()) {
                return v6.toIPv4Address().toString();
            }

            const prefix = v6.toByteArray().slice(0, 8);
            return prefix.map(byte => byte.toString(16).padStart(2, "0")).join("");
        }
    }
    catch {
        // Not a parseable address. Use the raw value as its own bucket.
    }

    return ip;
};
