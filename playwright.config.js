import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  testMatch:'**/*.browser.spec.js',
  timeout:45000,
  expect:{timeout:8000},
  fullyParallel:true,
  workers:2,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'webkit',use:{...devices['Desktop Safari']}},
  ],
  webServer:{command:'npm start',url:'http://127.0.0.1:4173',reuseExistingServer:true,timeout:30000},
});
