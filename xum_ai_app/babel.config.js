module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", {
                jsxImportSource: "nativewind",          // NativeWind v4: transforms className → style
                unstable_transformImportMeta: true,     // Supabase / ESM compat
            }]
        ],
        plugins: [
            'react-native-reanimated/plugin',           // Must be last
        ],
    };
};
