/**
 * Config plugin: allow an Android build from a path with non-ASCII characters.
 *
 * This repository lives in a folder containing an en dash ("–"). The Android
 * Gradle Plugin refuses to configure a project whose path is not pure ASCII and
 * points at `android.overridePathCheck=true` as the supported escape hatch.
 *
 * Written as a config plugin so the property is re-applied every time
 * `expo prebuild` regenerates the native project.
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'android.overridePathCheck';

module.exports = function withGradlePathOverride(config) {
  return withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = gradleConfig.modResults.filter(
      (item) => !(item.type === 'property' && item.key === KEY)
    );
    gradleConfig.modResults.push({ type: 'property', key: KEY, value: 'true' });
    return gradleConfig;
  });
};
