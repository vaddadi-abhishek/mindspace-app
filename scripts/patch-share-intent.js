const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-share-intent',
  'ios',
  'ExpoShareIntentModule.swift'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
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
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-share-intent] Successfully injected setAppGroupValue into ExpoShareIntentModule.swift');
  }
}
