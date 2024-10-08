import { defineConfig } from 'tsup'
export default defineConfig((opts)=>{
    return {
        entry: ["./index.ts"],
        splitting: false,
        sourcemap: true,
        dts: true,
        clean: true,
        format: ["esm", "cjs"],
        ignoreWatch: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
        ]
    }
})