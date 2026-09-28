// End-to-end tests against the built game. `npm run test:e2e` builds first;
// Playwright then serves dist/ with `vite preview` and runs tests/e2e/.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1200, height: 800 },
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1200, height: 800 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1200, height: 800 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1200, height: 800 } } },
    { name: "phone", use: { ...devices["Pixel 7"], isMobile: true, hasTouch: true } },
  ],
});
