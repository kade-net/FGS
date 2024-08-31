import { defineConfig } from 'tsup'
export default defineConfig((opts)=>{
    return {
        entry: ["./src/index.ts"],
        splitting: false,
        sourcemap: true,
        dts: true,
        clean: true,
        format: ["esm"],
        ignoreWatch: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
        ]
    }
})