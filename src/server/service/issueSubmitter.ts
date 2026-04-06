import { Octokit } from "@octokit/rest";
import { config } from "../config.js";
import type { Piece, PuzzleDate } from "../../common/types.js";
import type { SessionUser } from "../auth/passport.js";

const octokit = new Octokit({
    auth: config.github.token
});

export type IssueType = "bug" | "enhancement";

/**
 * Base function to create a GitHub issue
 */
async function createGitHubIssue(title: string, body: string, labels: string[]) {
    return await octokit.issues.create({
        owner: config.github.owner!,
        repo: config.github.repo!,
        title,
        body,
        labels
    });
}

function escapeMarkdown(text: string): string {
    return text
        .replace(/[\r\n]+/g, " ")
        .replace(/[\\`*_{}[\]()#+\-.!|@]/g, "\\$&");
}

/**
 * Submits a generic issue (bug report or feature request)
 */
export async function submitIssue(title: string, description: string, type: IssueType, user: SessionUser) {
    const safeTitle = escapeMarkdown(title);
    const safeDescription = escapeMarkdown(description);
    const body = `**Reporter ID:** ${user.id}\n\n**Description:**\n${safeDescription}`;
    return await createGitHubIssue(safeTitle, body, [type]);
}

/**
 * Specifically reports an invalid solution submitted by a user
 */
export async function submitInvalidSolutionReport(pieces: Piece[], expectedDate: PuzzleDate, actualDate: PuzzleDate | null, user: SessionUser) {
    const actualDateStr = actualDate
        ? `${actualDate.month + 1}/${actualDate.day}`
        : "None/Invalid";

    // Project to known fields only — prevents any extra properties that slipped past
    // schema validation from being embedded verbatim in the GitHub issue body.
    const safePieces = pieces.map(({ id, position, isFlippedH, isFlippedV, rotation, isLocked }) => ({
        id, position, isFlippedH, isFlippedV, rotation, isLocked
    }));

    const title = `Bug: Invalid solution submitted for ${expectedDate.month + 1}/${expectedDate.day}`;
    const description = `
**User ID:** ${user.id}
**Target Date:** ${expectedDate.month + 1}/${expectedDate.day}
**Actual Date Found by Server:** ${actualDateStr}

**Submission Data:**
\`\`\`json
${JSON.stringify({ month: expectedDate.month, day: expectedDate.day, pieces: safePieces }, null, 2)}
\`\`\`
    `;

    return await createGitHubIssue(title, description, ["bug", "automated-report"]);
}
