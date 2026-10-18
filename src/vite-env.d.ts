/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth client ID (public). See .env.example. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
