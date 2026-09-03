import { submitIssue, submitInvalidSolutionReport } from "../../../src/server/service/issueSubmitter";
import type { SessionUser } from "../../../src/server/auth/passport";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// `var` is used intentionally: jest.mock factories are hoisted before imports,
// so `let`/`const` would be in the TDZ when the factory runs. `var` is hoisted
// and writable, so the assignment inside the factory succeeds.
var mockIssuesCreate: jest.Mock;

jest.mock("@octokit/rest", () => {
    mockIssuesCreate = jest.fn().mockResolvedValue({});
    return {
        Octokit: jest.fn().mockImplementation(() => ({
            issues: { create: mockIssuesCreate }
        }))
    };
});

// config uses import.meta.url — mock it to avoid ESM issues in Jest
jest.mock("../../../src/server/config", () => ({
    config: {
        github: { token: "test-token", owner: "test-owner", repo: "test-repo" }
    }
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const testUser: SessionUser = {
    id: "user-42",
    isAdmin: false,
    email: "user@example.com",
    name: "Test User"
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("issueSubmitter — escapeMarkdown via submitIssue", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIssuesCreate.mockResolvedValue({});
    });

    it("passes clean strings through unchanged", async () => {
        await submitIssue("Plain title", "Plain description", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.title).toBe("Plain title");
        expect(call.body).toContain("Plain description");
    });

    it("escapes markdown special characters in title", async () => {
        await submitIssue("*bold* title [with link](url)", "clean description", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.title).not.toMatch(/(?<!\\)\*/); // no unescaped *
        expect(call.title).not.toMatch(/(?<!\\)\[/); // no unescaped [
        expect(call.title).not.toMatch(/(?<!\\)\(/); // no unescaped (
        expect(call.title).toContain("\\*bold\\*");
    });

    it("escapes markdown special characters in description", async () => {
        await submitIssue("clean title", "`code block` and _italic_", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).toContain("\\`code block\\`");
        expect(call.body).toContain("\\_italic\\_");
    });

    it("escapes title and description independently", async () => {
        await submitIssue("title with #header", "description with |pipe|", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.title).toContain("\\#header");
        expect(call.body).toContain("\\|pipe\\|");
    });

    it("never includes a reporter identifier in the body", async () => {
        await submitIssue("title", "description", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).not.toContain(testUser.id);
        expect(call.body).not.toMatch(/reporter/i);
    });

    it("passes the issue type as a label", async () => {
        await submitIssue("title", "description", "enhancement");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.labels).toContain("enhancement");
    });

    it("strips newlines to prevent structural injection", async () => {
        const injected = "Seems fine\n\n**Description:** fake second section\n\n@admin ATTACK";
        await submitIssue("Normal title", injected, "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).not.toMatch(/\*\*Description:\*\* fake second section/);
        expect(call.body.split("**Description:**")).toHaveLength(2); // only the real one
    });

    it("escapes @ to prevent mention injection", async () => {
        await submitIssue("title", "cc @admin please look", "bug");

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).not.toMatch(/(?<!\\)@admin/); // no unescaped @mention
        expect(call.body).toContain("\\@admin");
    });
});

describe("issueSubmitter — submitInvalidSolutionReport", () => {
    const piece = { id: 1 as const, position: { x: 0, y: 0 }, isFlippedH: false, isFlippedV: false, rotation: 0 as const };

    beforeEach(() => {
        jest.clearAllMocks();
        mockIssuesCreate.mockResolvedValue({});
    });

    it("creates an issue with the correct title and labels", async () => {
        await submitInvalidSolutionReport([piece], { month: 0, day: 1 }, null);

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.title).toContain("1/1");
        expect(call.labels).toContain("bug");
        expect(call.labels).toContain("automated-report");
    });

    it("never includes a user identifier in the body", async () => {
        await submitInvalidSolutionReport([piece], { month: 0, day: 1 }, null);

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).not.toContain(testUser.id);
        expect(call.body).not.toMatch(/user id/i);
    });

    it("strips extra properties from pieces in the issue body", async () => {
        // Cast to any to simulate extra fields surviving a future schema relaxation
        const pieceWithExtra = { ...piece, injected: "```\n## INJECTED\n```json" } as any;

        await submitInvalidSolutionReport([pieceWithExtra], { month: 0, day: 1 }, null);

        const call = mockIssuesCreate.mock.calls[0][0];
        expect(call.body).not.toContain("injected");
        expect(call.body).not.toContain("INJECTED");
    });
});
