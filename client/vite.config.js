
import { defineConfig } from 'vite'

export default defineConfig({
    root: "./src",
    assetsInclude: ["**/*.txt"],
    build: {
        outDir: "../../dist/client",
        sourcemap: true,
    },
    server: {
        watch: {
          usePolling: true,
        },
        proxy: {
            "/socket.io": {
                target: "ws://localhost:8080",
                ws: true
            }
        }
    }
})