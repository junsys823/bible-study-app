#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# 1. Resolve Android SDK path
if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
    if [[ -d "$HOME/Library/Android/sdk" ]]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    elif [[ -d "$HOME/Android/Sdk" ]]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [[ -d "/usr/lib/android-sdk" ]]; then
        export ANDROID_HOME="/usr/lib/android-sdk"
    else
        echo "Error: ANDROID_HOME is not set and Android SDK could not be found automatically." >&2
        exit 1
    fi
fi
sdk="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"

# 2. Resolve Java
if [[ -z "${JAVA_HOME:-}" ]]; then
    if [[ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
        export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    elif [[ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]]; then
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    elif command -v javac >/dev/null 2>&1; then
        export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(which javac)" 2>/dev/null || which javac)")")"
    fi
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
fi

# 3. Locate build tools and android.jar
tools=$(ls -d "$sdk/build-tools/"* 2>/dev/null | sort -V | tail -n 1)
platform_dir=$(ls -d "$sdk/platforms/android-"* 2>/dev/null | sort -V | tail -n 1)
platform="$platform_dir/android.jar"
KEYSTORE="${KEYSTORE:-"work/development.jks"}"

if [[ -z "$tools" || ! -d "$tools" ]]; then
    echo "Error: No Android build-tools found in $sdk/build-tools/" >&2
    exit 1
fi
if [[ -z "$platform" || ! -f "$platform" ]]; then
    echo "Error: android.jar not found in $sdk/platforms/" >&2
    exit 1
fi

mkdir -p work/classes work/dex outputs

echo "=== 1. Compiling Java sources ==="
rm -rf work/classes/* work/dex/*
javac --release 8 -classpath "$platform" -d work/classes src/com/bible/study/cuv/MainActivity.java

echo "=== 2. Dexing classes with d8 ==="
"$tools/d8" --min-api 26 --lib "$platform" --output work/dex work/classes/com/bible/study/cuv/*.class

echo "=== 3. Packaging resources and assets with aapt ==="
"$tools/aapt" package -f -M AndroidManifest.xml -S res -A assets -I "$platform" -F work/base.apk

echo "=== 4. Adding classes.dex to APK ==="
(cd work/dex && zip -q ../base.apk classes.dex)

echo "=== 5. Aligning APK ==="
"$tools/zipalign" -f 4 work/base.apk work/aligned.apk

echo "=== 6. Signing APK ==="
if [[ ! -f "$KEYSTORE" ]]; then
    keytool -genkeypair -keystore "$KEYSTORE" -alias dev -keyalg RSA -storepass android -keypass android -dname CN=BibleStudy -validity 3650
fi

"$tools/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android --out outputs/Bible-Study.apk work/aligned.apk
"$tools/apksigner" verify outputs/Bible-Study.apk

echo "✓ Successfully built outputs/Bible-Study.apk"
ls -lh outputs/Bible-Study.apk
