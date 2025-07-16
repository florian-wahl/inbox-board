module.exports = {
    plugins: {
        autoprefixer: {},
        cssnano: {
            preset: ['default', {
                discardComments: { removeAll: true },
                normalizeWhitespace: true
            }]
        }
    }
} 