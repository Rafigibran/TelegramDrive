# Android self-hosted runner

The Android Release workflow uses a GitHub Actions self-hosted Linux runner so Android compilation does not consume GitHub-hosted runner minutes.

## Runner requirements

Use an always-on Linux machine with:
- Git
- Node.js 20+
- npm
- Java 17
- Rust
- Android SDK command-line tools
- Android SDK Platform 36
- Android Build Tools 36.0.0
- Android NDK 28.0.12433566

The runner also needs internet access and enough RAM/storage for a Tauri Android build.

## Register the runner

In GitHub open:

Repository -> Settings -> Actions -> Runners -> New self-hosted runner

Choose Linux and the architecture of the machine.

Run GitHub's generated setup commands on the runner. Do not commit the registration token.

Start the runner with:

```bash
./run.sh
```

Keep the runner process running. For a persistent server, install it as a service when supported by the environment.

## Ubuntu / Debian dependencies

Install the required system packages first:

```bash
sudo apt-get update
sudo apt-get install -y git curl unzip zip build-essential pkg-config libssl-dev
```

Install Node.js 20, Java 17, Rust, and Android SDK/NDK according to the official installers for the machine.

The workflow itself installs the Android SDK packages and configures the NDK path when the runner already has the Android SDK command-line tools available.

## Android build flow

Every push to `main` starts the Android Release workflow.

The workflow order is:

1. Build the arm64 APK.
2. Verify that the APK exists.
3. Create a unique GitHub Release.
4. Upload the APK directly to that Release.

There is no `actions/upload-artifact` step and no AAB build.

Release tags are generated in the form:

`android-v<VERSION>-build-<RUN_NUMBER>-<RUN_ATTEMPT>`

Do not put the runner registration token, GitHub PAT, or other credentials in the repository.
