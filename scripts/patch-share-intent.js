const fs = require('fs');
const path = require('path');

// 1. Patch iOS ExpoShareIntentModule.swift
const iosTargetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-share-intent',
  'ios',
  'ExpoShareIntentModule.swift'
);

if (fs.existsSync(iosTargetFile)) {
  let content = fs.readFileSync(iosTargetFile, 'utf8');
  if (!content.includes('setAppGroupValue')) {
    const targetAnchor = 'Function("clearShareIntent") { (sharedKey: String) in';
    const injection = `        Function("setAppGroupValue") { (key: String, value: String) in
            let appGroupIdentifier = self.getAppGroupIdentifier()
            let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
            userDefaults?.set(value, forKey: key)
            userDefaults?.synchronize()
        }

        Function("getAppGroupValue") { (key: String) -> String? in
            let appGroupIdentifier = self.getAppGroupIdentifier()
            let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
            return userDefaults?.string(forKey: key)
        }

        ${targetAnchor}`;

    content = content.replace(targetAnchor, injection);
    fs.writeFileSync(iosTargetFile, content, 'utf8');
    console.log('[patch-share-intent] Successfully injected setAppGroupValue into ExpoShareIntentModule.swift');
  }
}

// 2. Patch Android ExpoShareIntentModule.kt
const androidTargetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-share-intent',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'shareintent',
  'ExpoShareIntentModule.kt'
);

if (fs.existsSync(androidTargetFile)) {
  let content = fs.readFileSync(androidTargetFile, 'utf8');
  if (!content.includes('setAppGroupValue')) {
    const targetAnchor = 'Function("clearShareIntent") { _: String ->';
    const injection = `        Function("setAppGroupValue") { key: String, value: String ->
            val prefs = context.getSharedPreferences("MindspacePrefs", Context.MODE_PRIVATE)
            prefs.edit().putString(key, value).apply()
        }

        Function("getAppGroupValue") { key: String ->
            val prefs = context.getSharedPreferences("MindspacePrefs", Context.MODE_PRIVATE)
            prefs.getString(key, null)
        }

        ${targetAnchor}`;

    content = content.replace(targetAnchor, injection);
    fs.writeFileSync(androidTargetFile, content, 'utf8');
    console.log('[patch-share-intent] Successfully injected setAppGroupValue into ExpoShareIntentModule.kt');
  }
}
