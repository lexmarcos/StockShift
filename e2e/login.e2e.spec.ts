import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test } from "@playwright/test";

const authStatePath = "e2e/.auth/user.json";

const credentials = {
  email: process.env.PLAYWRIGHT_TEST_EMAIL ?? "test@test.com",
  password: process.env.PLAYWRIGHT_TEST_PASSWORD ?? "test123",
};

test.describe("Login E2E", () => {
  test("deve autenticar com credenciais validas e salvar sessao para os demais testes", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[name="email"]').fill(credentials.email);
    await page.locator('input[name="password"]').fill(credentials.password);
    await page.getByRole("button", { name: "Entrar no Sistema" }).click();

    await expect(page).toHaveURL(/\/warehouses$/, { timeout: 15_000 });

    await mkdir(dirname(authStatePath), { recursive: true });
    await page.context().storageState({ path: authStatePath });
  });
});
