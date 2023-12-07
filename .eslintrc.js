const IS_PROD = process.env.NODE_ENV === 'production'
module.exports = {
    root: true,
    extends: [
        'cmyr',
    ],
    rules: {
        'no-console': 0,
    },
}
