import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7940c4cb942f48c4aaf23eeabcbd074e',
  appName: 'mstwins',
  webDir: 'dist',
  server: {
    url: 'https://7940c4cb-942f-48c4-aaf2-3eeabcbd074e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#2563eb',
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2563eb',
      sound: 'default'
    },
    Haptics: {
      // Haptics are enabled by default on iOS and Android
    },
    App: {
      deepLinkingEnabled: true,
      handleDeepLinks: true
    },
    Device: {
      // Device info is enabled by default
    },
    Network: {
      // Network monitoring is enabled by default
    }
  },
  // iOS specific configuration
  ios: {
    scheme: 'mstwins',
    contentInset: 'automatic',
    backgroundColor: '#ffffff'
  },
  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreKeyPassword: undefined,
      releaseType: 'AAB',
      signingType: 'apksigner'
    },
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'MStwins-Mobile-App',
    overrideUserAgent: undefined,
    useLegacyBridge: false
  }
};

export default config;