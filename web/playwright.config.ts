import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // E2E 共用一个持续累积的数据库；完整候选集要跨页读取，
  // 并行写入会让 offset 分页出现重复或漏项，因此串行执行。
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium' },
  reporter: 'list',
})
