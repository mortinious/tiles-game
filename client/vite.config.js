
export default {
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
    }
}