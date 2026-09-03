import { rateLimitKey } from "../../src/server/utils/rateLimitKey";

describe("rateLimitKey – rate-limit bucket derivation", () => {
    describe("IPv6", () => {
        it("puts addresses in the same /64 into one bucket", () => {
            // A carrier assigns one /64 per subscriber. Privacy extensions rotate the
            // host part, so a /128 key would give one client unlimited buckets.
            const a = rateLimitKey("2a0d:6fc7:723:b182:d73f:ea03:2b29:dc55");
            const b = rateLimitKey("2a0d:6fc7:723:b182:ffff:1111:2222:3333");

            expect(a).toBe(b);
        });

        it("keeps different /64 prefixes in separate buckets", () => {
            const a = rateLimitKey("2a0d:6fc7:723:b182:d73f:ea03:2b29:dc55");
            const b = rateLimitKey("2a0d:6fc7:723:b999:d73f:ea03:2b29:dc55");

            expect(a).not.toBe(b);
        });

        it("handles compressed notation", () => {
            expect(rateLimitKey("2a0d:6fc7::1")).toBe(rateLimitKey("2a0d:6fc7:0:0:ffff:ffff:ffff:ffff"));
        });
    });

    describe("IPv4", () => {
        it("keys on the full address", () => {
            expect(rateLimitKey("84.94.202.56")).toBe("84.94.202.56");
        });

        it("keeps different addresses in separate buckets", () => {
            expect(rateLimitKey("84.94.202.56")).not.toBe(rateLimitKey("84.94.202.57"));
        });
    });

    describe("IPv4-mapped IPv6", () => {
        it("keeps different addresses in separate buckets", () => {
            // Every IPv4-mapped address shares the same first 8 bytes. Applying the /64
            // rule to them would collapse all IPv4 clients into a single bucket.
            expect(rateLimitKey("::ffff:84.94.202.56")).not.toBe(rateLimitKey("::ffff:1.2.3.4"));
        });

        it("matches the bucket of the same address in plain IPv4 form", () => {
            expect(rateLimitKey("::ffff:84.94.202.56")).toBe(rateLimitKey("84.94.202.56"));
        });
    });

    describe("unparseable input", () => {
        it("falls back to the raw value", () => {
            expect(rateLimitKey("not-an-ip")).toBe("not-an-ip");
        });

        it("keeps distinct raw values in separate buckets", () => {
            expect(rateLimitKey("not-an-ip")).not.toBe(rateLimitKey("also-not-an-ip"));
        });
    });
});
