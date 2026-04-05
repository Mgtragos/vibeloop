"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f9ff',
                    500: '#0ea5e9',
                    900: '#0c4a6e',
                },
            },
        },
    },
    plugins: [],
};
exports.default = config;
//# sourceMappingURL=tailwind.config.js.map