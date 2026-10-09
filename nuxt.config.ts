// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: {
    enabled: true,
  },

  modules: [
    "vuetify-nuxt-module",
    "@pinia/nuxt",
    "nuxt-vuefire",
  ],

  ssr: false,

  // Prevents stale build asset caching issues on deploy
  experimental: {
    payloadExtraction: false,
  },

  // Forces fresh headers for HTML & JS chunks in client-only SPA
  routeRules: {
    "/**": {
      headers: {
        "cache-control": "no-cache, no-store, must-revalidate",
      },
    },
    "/_nuxt/**": {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
  },

  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: "defaultTheme",
        themes: {
          defaultTheme: {
            dark: false,
            colors: {
              background: "#FFFFFF",
              surface: "#FFFFFF",
              "surface-bright": "#FFFFFF",
              "surface-light": "#EEEEEE",
              "surface-variant": "#424242",
              "on-surface-variant": "#EEEEEE",
              primary: "#1867C0",
              "primary-darken-1": "#1F5592",
              secondary: "#48A9A6",
              "secondary-darken-1": "#018786",
              error: "#B00020",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#FB8C00",
              pengajuan: "#6E747B",
              setuju: "#004AAD",
            },
          },
        },
      },
    },
  },

  runtimeConfig: {
    // Private: only available to Nitro server handlers, never exposed to browser code.
    adminAccessPin: process.env.NUXT_ADMIN_ACCESS_PIN || "090988",
    public: {
      apiBaseUrl: process.env.urlapi,
    },
  },

  vuefire: {
    config: {
      apiKey: process.env.apiKey,
      authDomain: process.env.authDomain,
      projectId: process.env.projectId,
      storageBucket: process.env.storageBucket,
      messagingSenderId: process.env.messagingSenderId,
      appId: process.env.appId,

      databaseURL:
        "https://dutarayamarine-default-rtdb.asia-southeast1.firebasedatabase.app",
    },
  },
});
