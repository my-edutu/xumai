---
description: Setup and run EAS Build for Expo projects
---

This workflow guides you through setting up Expo Application Services (EAS) Build, configuring the project, and running your first build.

1. **Install EAS CLI**
   Ensure the EAS CLI is installed globally to interact with EAS services.
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo**
   Authenticate with your Expo account.
   ```bash
   eas login
   ```
   *Note: You can check if you are already logged in with `eas whoami`.*

3. **Configure the Project**
   Initialize the build configuration for Android and iOS. This creates an `eas.json` file.
   ```bash
   eas build:configure
   ```

4. **Install Development Client (Recommended)**
   For a better development experience, install the `expo-dev-client` library. This allows you to create a custom development build.
   ```bash
   npx expo install expo-dev-client
   ```

5. **Run a Build**
   Start the build process. You can choose to build for a specific platform or both.
   
   **For Android and iOS (all):**
   ```bash
   eas build --platform all
   ```
   
   **For Android only:**
   ```bash
   eas build --platform android
   ```
   
   **For iOS only:**
   ```bash
   eas build --platform ios
   ```

   *Note: If you haven't set up credentials (keystore/provisioning profile), EAS CLI will prompt you to generate them automatically.*

6. **Wait and Deploy**
   The CLI will provide a link to the build details page. Once complete, you can:
   - **zInstall:** Use the "Install" button on the build page (for Simulators/Devices).
   - **Submit:** If built for distribution, use `eas submit` to send to app stores.
