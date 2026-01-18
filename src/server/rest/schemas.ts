/**
 * Common JSON schemas for REST API input validation
 */

export const dateParamSchema = {
    type: "object",
    required: ["date"],
    properties: {
        date: {
            type: "string",
            pattern: "^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$",
            description: "Date in MM-DD format"
        }
    }
};

export const positionSchema = {
    type: "object",
    required: ["x", "y"],
    properties: {
        x: { type: "integer" },
        y: { type: "integer" }
    }
};

export const pieceSchema = {
    type: "object",
    required: ["id", "isFlippedH", "isFlippedV", "rotation"],
    properties: {
        id: { type: "integer" },
        position: {
            oneOf: [
                positionSchema,
                { type: "null" }
            ]
        },
        isFlippedH: { type: "boolean" },
        isFlippedV: { type: "boolean" },
        rotation: { 
            type: "integer",
            enum: [0, 90, 180, 270]
        },
        isLocked: { type: "boolean" }
    }
};

export const statsStartSchema = {
    type: "object",
    required: ["month", "day"],
    properties: {
        month: { type: "integer", minimum: 0, maximum: 11 },
        day: { type: "integer", minimum: 1, maximum: 31 }
    }
};

export const statsCompleteSchema = {
    type: "object",
    required: ["month", "day", "pieces"],
    properties: {
        month: { type: "integer", minimum: 0, maximum: 11 },
        day: { type: "integer", minimum: 1, maximum: 31 },
        pieces: {
            type: "array",
            items: pieceSchema,
            minItems: 8, // The puzzle always has 8 pieces
            maxItems: 8
        }
    }
};
