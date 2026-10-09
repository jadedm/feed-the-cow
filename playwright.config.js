// End-to-end tests against the built game. `npm run test:e2e` builds first;
// Playwright then serves dist/ with `vite preview` and runs tests/e2e/.
import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets the suite run beside a preview already using 4173.
const PORT = Number(process.env.E2E_PORT) || 4173;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Timing tests measure speed against the wall clock; fewer parallel
  // browsers on a shared CI runner keeps frame times honest.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1200, height: 800 },
    trace: "retain-on-failure",
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
