module.exports = {
    parser: "@typescript-eslint/parser",
    extends: [
        'eslint:recommended',
        'airbnb-base',
    ],
    ignorePatterns: [
      "node_modules/",
      "build/",
      "dist/"
    ],
    parserOptions: {
        "ecmaVersion": 2019,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": false,
            "modules": true
        },
        "useJSXTextNode": true,
        "project": "./tsconfig.json",
        "tsconfigRootDir": __dirname
    },
    plugins: [
        '@typescript-eslint',
    ],
    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx"]
            }
        }
    },
    rules: {
        "no-console": "off",
        "no-await-in-loop": "off"
    }
};



