
export default {
    root: "./src",
    build: {
        outDir: "../../dist/client",
        sourcemap: true
    },
    server: {
        watch: {
          usePolling: true,
        },
    }
}