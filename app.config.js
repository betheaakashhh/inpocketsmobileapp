// Dynamic config layered on app.json.
//
// Cleartext (http://) traffic is ONLY enabled for local development, where the backend runs on
// your laptop over the LAN. Any EAS build (preview or production) is https-only.
module.exports = ({ config }) => {
  const isEasBuild = Boolean(process.env.EAS_BUILD_PROFILE);
  const plugins = (config.plugins || []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
      ? ['expo-build-properties', { android: { usesCleartextTraffic: !isEasBuild } }]
      : plugin,
  );
  return { ...config, plugins };
};
