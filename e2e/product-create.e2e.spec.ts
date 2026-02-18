import { expect, test } from "@playwright/test";

const mockWarehouseId = "wh-alpha";
const mockCategoryId = "cat-eletronicos";
const mockBrandId = "brand-stockshift";

test.describe("Product Create E2E", () => {
  test("deve criar um produto e redirecionar para /products", async ({ page }) => {
    let createProductPayloadRaw = "";
    let createProductContentType = "";

    await page.route("**/api/warehouses", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: mockWarehouseId,
              code: "ALPHA",
              name: "Warehouse Alpha",
              city: "Sao Paulo",
              state: "SP",
              address: "Rua Um, 100",
              isActive: true,
              createdAt: "2026-01-01T10:00:00.000Z",
              updatedAt: "2026-01-01T10:00:00.000Z",
            },
          ],
        }),
      });
    });

    await page.route("**/api/categories", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: mockCategoryId, name: "Eletrônicos" }],
        }),
      });
    });

    await page.route("**/api/brands", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: mockBrandId, name: "StockShift Labs" }],
        }),
      });
    });

    await page.route("**/api/batches/with-product", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      createProductPayloadRaw = route.request().postData() ?? "";
      createProductContentType = route.request().headers()["content-type"] ?? "";

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Produto e lote criados com sucesso!",
          data: {
            product: {
              id: "prod-1",
              name: "Notebook E2E",
            },
            batch: {
              id: "batch-1",
              productId: "prod-1",
            },
          },
        }),
      });
    });

    await page.addInitScript((warehouseId) => {
      window.localStorage.setItem("selected-warehouse-id", warehouseId);
      window.localStorage.setItem("productCreate:continuousMode", "false");
    }, mockWarehouseId);

    await page.goto("/products/create");

    await expect(page.getByText("Informações Básicas")).toBeVisible();

    await page.getByLabel(/Nome do Produto/i).fill("Notebook E2E");
    await page.getByLabel(/Descrição Detalhada/i).fill("Produto criado via teste e2e");
    await page.getByLabel(/Qtd\. Inicial/i).fill("15");

    await page.getByRole("button", { name: /Salvar Produto/i }).click();

    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });

    expect(createProductContentType).toContain("multipart/form-data");
    expect(createProductPayloadRaw).toContain('"name":"Notebook E2E"');
    expect(createProductPayloadRaw).toContain('"warehouseId":"wh-alpha"');
    expect(createProductPayloadRaw).toContain('"quantity":15');
  });
});
