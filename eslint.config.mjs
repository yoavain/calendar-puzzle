import { fixupPluginRules } from "@eslint/compat";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jasmine from "eslint-plugin-jasmine";
import jest from "eslint-plugin-jest";
import n from "eslint-plugin-n";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import barrelFiles from "eslint-plugin-barrel-files";
import globals from "globals";
import tseslint from "typescript-eslint";

// region file globs

// ------------------------------------------------------------------------------------------
// File globs by type
// ------------------------------------------------------------------------------------------
const JS_FILES = ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.jsx"];
const TS_FILES = ["**/*.ts", "**/*.tsx"];
const REACT_FILES = ["**/*.jsx", "**/*.tsx"];
const TEST_FILES = ["**/test/**/*"];

// endregion file globs

// region rules

// ------------------------------------------------------------------------------------------
// Shared base configurations
// ------------------------------------------------------------------------------------------
const BASE_LANGUAGE_OPTIONS = {
    ecmaVersion: 2022,
    sourceType: "module"
};

const BASE_GLOBALS = {
    ...globals.es2021,
    ...globals.node,
    ...globals.browser,
    ...globals.jest,
    ...globals.jasmine,
    ...globals.react,
    React: "readonly",
    JSX: "readonly"
};

const SHARED_PLUGINS = {
    import: fixupPluginRules(importPlugin),
    n: fixupPluginRules(n),
    unicorn: fixupPluginRules(unicorn)
};

const SHARED_SETTINGS = {
    "import/resolver": {
        node: true,
        typescript: true
    }
};

// ------------------------------------------------------------------------------------------
// Style rules
// ------------------------------------------------------------------------------------------
const STYLE_RULES = {
    "max-len": ["error", { "code": 200 }],
    "indent": ["error", 4, { "SwitchCase": 1 }],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "brace-style": ["error", "stroustrup"],
    "curly": ["error", "all"],
    "object-curly-spacing": ["error", "always"],
    "no-mixed-spaces-and-tabs": "error",
    "arrow-spacing": "error",
    "comma-dangle": ["error", "never"],
    "comma-style": "error",
    "no-extra-semi": "error",
    "comma-spacing": "error",
    "space-in-parens": ["error", "never"],
    "space-before-blocks": "error",
    "space-before-function-paren": [
        "error",
        { "anonymous": "never", "named": "never", "asyncArrow": "always" }
    ],
    "keyword-spacing": "error",
    "no-multi-spaces": "error",
    "space-infix-ops": "error",
    "one-var": ["error", "never"]
};

// ------------------------------------------------------------------------------------------
// Base JS quality and ecosystem rules
// ------------------------------------------------------------------------------------------
const JS_RULES = {
    ...js.configs.recommended.rules,
    "no-console": "error",
    "no-unused-vars": "off",
    "no-useless-escape": "off",
    "no-empty-pattern": "off",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-prototype-builtins": "warn",
    "no-await-in-loop": "warn",
    "require-atomic-updates": "warn",
    "no-promise-executor-return": "warn",

    // Import plugin
    "import/extensions": [
        "error",
        {
            "ts": "never",
            "tsx": "never",
            "js": "never",
            "jsx": "never",
            "mjs": "always",
            "mts": "always",
            "json": "always"
        }
    ],
    "import/named": "warn",
    "import/no-duplicates": "error",
    "import/no-unresolved": "warn",
    "import/no-default-export": "warn",
    "import/order": [
        "off", // todo - might be useful
        {
            "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
            "newlines-between": "always",
            "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
    ],

    // Node plugin
    "n/no-sync": "off",
    "n/exports-style": ["error", "module.exports"],
    "n/no-unpublished-require": "off",
    "n/no-extraneous-import": "off",
    "n/no-deprecated-api": "warn",
    "n/no-missing-require": "error",
    "n/no-missing-import": "error",
    "n/no-unpublished-import": "off",
    "n/no-unsupported-features/es-syntax": "off",
    "n/no-unsupported-features/es-builtins": ["error", { "ignores": [] }],
    "n/no-unsupported-features/node-builtins": [
        "error",
        {
            "ignores": [
                "Blob",
                "crypto",
                "CustomEvent",
                "DOMException",
                "fetch",
                "File",
                "FormData",
                "fs.globSync",
                "navigator",
                "localStorage",
                "navigator.language",
                "navigator.platform",
                "navigator.userAgent",
                "Response",
                "sessionStorage",
                "Storage",
                "stream.Readable.fromWeb",
                "URL.createObjectURL",
                "URL.revokeObjectURL",
                "util.parseArgs"
            ]
        }
    ],

    // Unicorn
    "unicorn/prefer-node-protocol": "error"
};

// ------------------------------------------------------------------------------------------
// TypeScript rules
// ------------------------------------------------------------------------------------------
const TS_RULES = {
    ...tseslint.configs.recommendedTypeChecked.rules,
    "import/extensions": "off",
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": "error",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": [
        "error",
        { "prefer": "type-imports" }
    ],
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/await-thenable": "warn",
    "@typescript-eslint/no-misused-promises": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "n/exports-style": "off"
};

// ------------------------------------------------------------------------------------------
// React rules
// ------------------------------------------------------------------------------------------
const REACT_RULES = {
    ...react.configs.recommended.rules,
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "react/display-name": "warn",
    "react/jsx-key": "warn",
    "react/no-deprecated": "error",
    "react/no-string-refs": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "warn",
    "react/no-unknown-property": "warn",
    "react/jsx-no-bind": ["warn", { "allowArrowFunctions": true }],
    "react/no-array-index-key": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
};


// ------------------------------------------------------------------------------------------
// Test files rules
// ------------------------------------------------------------------------------------------
const TEST_RULES = {
    ...jest.configs.recommended.rules,
    "no-console": "off",
    "max-len": "off",
    "jest/no-conditional-expect": "off",
    "jest/no-done-callback": "warn",
    "jest/no-export": "off",
    "jest/no-identical-title": "warn",
    "jest/no-jasmine-globals": "off",
    "jest/no-standalone-expect": "warn",
    "jest/valid-expect": "warn",
    "jest/valid-expect-in-promise": "warn",
    "jest/valid-title": "warn"
};

// endregion rules

// region config

// ------------------------------------------------------------------------------------------
// Ignore patterns for files and directories not to lint
// ------------------------------------------------------------------------------------------
export const IGNORE_CONFIG = {
    ignores: [
        "**/node_modules/",
        "**/dist/",
        "**/build/",
        "**/coverage/",
        "**/out/",
        "**/*.min.*",
        ".serverless/"
    ]
};

// ------------------------------------------------------------------------------------------
// JavaScript files config (globals, plugins, settings, and base JS rules)
// ------------------------------------------------------------------------------------------
export const JS_CONFIG = {
    files: JS_FILES,
    languageOptions: {
        ...BASE_LANGUAGE_OPTIONS,
        globals: BASE_GLOBALS,
        parserOptions: {
            ecmaFeatures: {
                jsx: true
            }
        }
    },
    plugins: SHARED_PLUGINS,
    settings: {
        ...SHARED_SETTINGS,
        node: {
            allowModules: ["chai"],
            tryExtensions: [".ts", ".tsx", ".js", ".jsx", ".d.ts", ".json"]
        },
        import: {
            extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".json"]
        }
    },
    rules: {
        ...STYLE_RULES,
        ...JS_RULES,
        "no-unused-vars": "warn"
    }
};

// ------------------------------------------------------------------------------------------
// TypeScript files config (parser, project service, plugins, and TS rules)
// ------------------------------------------------------------------------------------------
export const TS_CONFIG = {
    files: TS_FILES,
    languageOptions: {
        ...BASE_LANGUAGE_OPTIONS,
        parser: tseslint.parser,
        globals: {
            ...BASE_GLOBALS,
            NodeJS: true,
            React: "readonly",
            JSX: "readonly"
        },
        parserOptions: {
            projectService: true,
            ecmaFeatures: {
                jsx: true
            }
        }
    },
    plugins: {
        "@typescript-eslint": tseslint.plugin,
        ...SHARED_PLUGINS
    },
    settings: SHARED_SETTINGS,
    rules: {
        ...STYLE_RULES,
        ...JS_RULES,
        ...TS_RULES,
        "n/no-missing-import": "off",
        "n/no-missing-require": "off"
    }
};

// ------------------------------------------------------------------------------------------
// React files config (JSX settings, React plugins, and React rules)
// ------------------------------------------------------------------------------------------
export const REACT_CONFIG = {
    files: REACT_FILES,
    plugins: {
        react: fixupPluginRules(react),
        "react-hooks": fixupPluginRules(reactHooks)
    },
    settings: {
        react: { version: "detect" }
    },
    rules: REACT_RULES
};

// ------------------------------------------------------------------------------------------
// Test files config (Jest globals and recommended rules)
// ------------------------------------------------------------------------------------------
export const TEST_CONFIG = {
    files: TEST_FILES,
    plugins: {
        jest: fixupPluginRules(jest),
        jasmine: fixupPluginRules(jasmine)
    },
    languageOptions: {
        globals: { ...globals.jest, ...globals.jasmine }
    },
    rules: TEST_RULES
};


// ------------------------------------------------------------------------------------------
// Storybook story files — Storybook requires `export default meta`
// ------------------------------------------------------------------------------------------
export const STORIES_CONFIG = {
    files: ["**/*.stories.ts", "**/*.stories.tsx"],
    rules: {
        "import/no-default-export": "off"
    }
};

export const OVERRIDES = [
    {
        files: ["**/client/**/*.{ts,tsx}"],
        plugins: {
            "barrel-files": barrelFiles
        },
        rules: {
            "barrel-files/avoid-barrel-files": "error",
            "barrel-files/avoid-importing-barrel-files": [
                "error",
                {
                    allowList: [
                        "@mui/material",
                        "@mui/material/styles"
                    ],
                    amountOfExportsToConsiderModuleAsBarrel: 10
                }
            ]
        }
    },
    {
        // Vite ?raw imports have query-string suffixes that eslint-plugin-barrel-files
        // cannot resolve with readFileSync — disable the barrel check for these files.
        files: ["**/client/**/ShareDialog.tsx"],
        rules: {
            "barrel-files/avoid-importing-barrel-files": "off"
        }
    },
    {
        // src/common/ is the pure game-logic layer: no DOM, no React, no framework imports.
        // CLAUDE.md states this boundary; these rules are what enforce it. Keep them in sync.
        files: ["src/common/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["react", "react/*", "react-dom", "react-dom/*"],
                            message: "src/common/ is the pure game-logic layer -> no React. Put UI code in src/client/."
                        },
                        {
                            group: ["@mui/*", "@emotion/*"],
                            message: "src/common/ is the pure game-logic layer -> no UI libraries. Put UI code in src/client/."
                        },
                        {
                            group: ["fastify", "fastify/*", "@fastify/*", "drizzle-orm", "drizzle-orm/*"],
                            message: "src/common/ must not depend on the server stack. Put backend code in src/server/."
                        },
                        {
                            group: ["**/client/**", "**/server/**"],
                            message: "src/common/ must not import from the client or server layers. Dependencies point inward."
                        }
                    ]
                }
            ],
            "no-restricted-globals": [
                "error",
                { name: "document", message: "src/common/ is DOM-free. Put DOM access in src/client/." },
                { name: "window", message: "src/common/ is DOM-free. Put DOM access in src/client/." },
                { name: "navigator", message: "src/common/ is DOM-free. Put DOM access in src/client/." },
                { name: "localStorage", message: "src/common/ is DOM-free. Put storage access in src/client/." },
                { name: "sessionStorage", message: "src/common/ is DOM-free. Put storage access in src/client/." }
            ]
        }
    },
    {
        // TypeScript already validates props at compile time, and the rule cannot
        // read prop types through a React.memo<Props>() generic - every report in
        // Board.tsx is a false positive. The rule stays on for plain .jsx files.
        files: TS_FILES,
        rules: {
            "react/prop-types": "off"
        }
    },
    {
        // Playwright steps are sequential by nature: each await depends on the page
        // state that the previous step produced. Parallel execution would be wrong.
        files: ["**/test/e2e/**/*"],
        rules: {
            "no-await-in-loop": "off"
        }
    },
    {
        // Every assertion in this file lives in the `solvesFor` helper. The rule
        // cannot follow a call into a helper, so it must be told the name.
        files: ["**/test/common/puzzleSolver.test.ts"],
        rules: {
            "jest/expect-expect": ["warn", { "assertFunctionNames": ["expect", "solvesFor"] }]
        }
    }
];

// endregion config

export default [
    IGNORE_CONFIG,
    JS_CONFIG,
    TS_CONFIG,
    REACT_CONFIG,
    TEST_CONFIG,
    STORIES_CONFIG,
    ...OVERRIDES
];
