/* eslint-disable no-console */
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../src/server/db/schema.js";
import fs from "node:fs";
import path from "node:path";


/**
 * This script generates docs/DB_SCHEMA.md by inspecting the Drizzle schema.
 * It uses the internal Drizzle metadata to build a Mermaid ER diagram and table descriptions.
 */

async function generateDocs() {
    const tables = [
        schema.solutions,
        schema.users,
        schema.userPuzzleStats
    ];

    let mermaid = "```mermaid\nerDiagram\n";
    let tableDetails = "## Tables\n\n";

    for (const table of tables) {
        if (!table) {
            continue;
        }
        const config = getTableConfig(table as any);
        const tableName = config.name;
        
        mermaid += `    ${tableName} {\n`;
        tableDetails += `### ${tableName}\n`;
        
        // Add a placeholder description - in a real scenario, we might extract this from JSDoc or a mapping
        if (tableName === "solutions") {
            tableDetails += "Stores pre-calculated solutions for each day of the year.\n";
        }
        else if (tableName === "users") {
            tableDetails += "Stores user information from Google OAuth.\n";
        }
        else if (tableName === "user_puzzle_stats") {
            tableDetails += "Tracks user progress and statistics for individual puzzles.\n";
        }

        for (const column of config.columns) {
            const name = column.name;
            const type = column.columnType.replace("Pg", "").toLowerCase();
            let constraints = "";
            
            if (column.primary) {
                constraints += " PK";
            }
            // @ts-ignore - isForeignKey exists at runtime but not in the PgColumn type definition
            if (column.isForeignKey || name === "user_id") {
                constraints += " FK";
            }

            mermaid += `        ${type} ${name}${constraints}\n`;
            
            // Add column descriptions based on known schema
            if (tableName === "solutions" && name === "date_key") {
                tableDetails += "- `date_key`: Format 'MM-DD' (e.g., '01-01').\n";
            }
            if (tableName === "solutions" && name === "pieces") {
                tableDetails += "- `pieces`: JSON representation of the solution pieces and their positions.\n";
            }
            if (tableName === "users" && name === "id") {
                tableDetails += "- `id`: Unique Google ID string.\n";
            }
            if (tableName === "users" && name === "is_admin") {
                tableDetails += "- `is_admin`: Flag for administrative access.\n";
            }
            if (tableName === "user_puzzle_stats" && name === "user_id") {
                tableDetails += "- `user_id`: Reference to the user.\n";
            }
            if (tableName === "user_puzzle_stats" && (name === "month" || name === "day")) {
                tableDetails += `- \`${name}\`: Part of the puzzle date.\n`;
            }
        }

        mermaid += "    }\n\n";
        tableDetails += "\n";
    }

    // Add known relationships
    mermaid += "    users ||--o{ user_puzzle_stats : \"has\"\n";
    mermaid += "```";

    const content = `# Database Schema

This diagram shows the database tables and their relationships.

${mermaid}

${tableDetails}`;

    const outputPath = path.resolve(process.cwd(), "docs/DB_SCHEMA.md");
    fs.writeFileSync(outputPath, content);
    console.log(`Successfully generated ${outputPath}`);
}

generateDocs().catch(console.error);
