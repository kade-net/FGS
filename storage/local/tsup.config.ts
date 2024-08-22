import { defineConfig } from 'tsup'

export default defineConfig((opts) => {
    return {
        entry: ["./index.ts"],
        splitting: false,
        dts: true,
        sourcemap: true,
        clean: false,
        format: ["esm"],
        ignoreWatch: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
        ]
    }
})