import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Register E2E", () => {
  test("deve exibir erros de validacao em campos vazios", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Criar Minha Empresa" }).click();

    await expect(page.getByText("Nome da empresa é obrigatório")).toBeVisible();
    await expect(page.getByText("E-mail inválido")).toBeVisible();
    await expect(
      page.getByText("Senha deve ter no mínimo 6 caracteres"),
    ).toBeVisible();
    await expect(
      page.getByText("Confirmação de senha é obrigatória"),
    ).toBeVisible();
  });

  test("deve exibir erro se as senhas nao conferem", async ({ page }) => {
    await page.goto("/register");

    await page.locator('input[name="companyName"]').fill("Minha Nova Empresa");
    await page.locator('input[name="email"]').fill("nova@empresa.com");
    await page.locator('input[name="password"]').fill("minhasenha123");
    await page.locator('input[name="confirmPassword"]').fill("senhadiferente");

    await page.getByRole("button", { name: "Criar Minha Empresa" }).click();

    await expect(page.getByText("As senhas não coincidem")).toBeVisible();
  });

  test("deve criar uma conta com sucesso e redirecionar", async ({ page }) => {
    await page.goto("/register");

    const uniqueEmail = `test_register_${Date.now()}@test.com`;

    await page
      .locator('input[name="companyName"]')
      .fill("Empresa de Teste E2E");
    await page.locator('input[name="email"]').fill(uniqueEmail);
    await page.locator('input[name="password"]').fill("senhaSegura123");
    await page.locator('input[name="confirmPassword"]').fill("senhaSegura123");

    // Intercepta qualquer chamada de API após o registro para evitar redirects decorrentes de 403 ou 401
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth/register")) {
        await route.fulfill({
          status: 200,
          headers: {
            "Set-Cookie": "accessToken=mocked-token; Path=/; HttpOnly",
          },
          json: {
            success: true,
            data: {
              userId: "123",
              userEmail: uniqueEmail,
              businessName: "Empresa de Teste E2E",
              tenantId: "tenant_abc",
            },
          },
        });
      } else {
        await route.fulfill({ status: 200, json: { success: true, data: [] } });
      }
    });

    await page.getByRole("button", { name: "Criar Minha Empresa" }).click();

    await expect(
      page.getByText("Empresa cadastrada com sucesso!"),
    ).toBeVisible();

    await expect(page).toHaveURL(/.*\/warehouses$/, { timeout: 10000 });
  });
});
