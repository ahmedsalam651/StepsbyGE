#!/usr/bin/env bash
set -euo pipefail

echo "🔨 Building Khatwati v52 Native iOS .ipa..."
SDK_PATH=$(xcrun --sdk iphoneos --show-sdk-path)
PayloadDir="build/Payload"
AppBundle="$PayloadDir/Khatwati.app"

rm -rf build Khatwati-v52.ipa
mkdir -p "$AppBundle/www"

if [ -f "AppDelegate.swift" ]; then
  SRC_DIR="."
else
  SRC_DIR="KhatwatiApp"
fi

# 1. Compile Swift sources into an arm64 iOS Mach-O executable
xcrun --sdk iphoneos swiftc   -target arm64-apple-ios15.0   -sdk "$SDK_PATH"   -O   "$SRC_DIR/AppDelegate.swift"   "$SRC_DIR/ViewController.swift"   -framework UIKit   -framework WebKit   -framework UserNotifications   -o "$AppBundle/Khatwati"

chmod +x "$AppBundle/Khatwati"

# 2. Copy Info.plist and Icons
cp "$SRC_DIR/Info.plist" "$AppBundle/Info.plist"
cp "$SRC_DIR"/Icon-*.png "$AppBundle/"

# 3. Copy web assets into Khatwati.app/www/
if [ -f "index.html" ]; then
  cp index.html "$AppBundle/www/"
  [ -f "sw.js" ] && cp sw.js "$AppBundle/www/"
  [ -f "icon.svg" ] && cp icon.svg "$AppBundle/www/"
elif [ -d "$SRC_DIR/www" ]; then
  cp -R "$SRC_DIR/www/"* "$AppBundle/www/"
fi

# 4. Ad-hoc sign so Sideloadly can re-sign cleanly with any free Apple ID
codesign --force --sign - --timestamp=none "$AppBundle" || true

# 5. Package Payload/ into Khatwati-v52.ipa
cd build
zip -qry ../Khatwati-v52.ipa Payload
cd ..

echo "✅ Successfully generated: Khatwati-v52.ipa"
