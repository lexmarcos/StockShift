import { expect, test } from "@playwright/test";

const mockWarehouses = [
  {
    id: "wh-alpha",
    code: "ALPHA",
    name: "Warehouse Alpha",
    city: "Sao Paulo",
    state: "SP",
    address: "Rua Um, 100",
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "wh-beta",
    code: "BETA",
    name: "Warehouse Beta",
    city: "Campinas",
    state: "SP",
    address: "Rua Dois, 200",
    isActive: true,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  },
];

test.describe("Warehouse Switch E2E", () => {
  test("deve trocar de warehouse e persistir a seleção", async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);

    const switchWarehousePayloads: string[] = [];

    const getSelectedWarehouseViaCdp = async () => {
      const result = await cdp.send("Runtime.evaluate", {
        expression: 'window.localStorage.getItem("selected-warehouse-id")',
      });

      return (result.result.value as string | null) ?? null;
    };

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
          data: mockWarehouses,
        }),
      });
    });

    await page.route("**/api/batches/warehouse/*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    await page.route("**/api/auth/switch-warehouse", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      switchWarehousePayloads.push(route.request().postData() ?? "");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Warehouse alterado",
        }),
      });
    });

    await page.goto("/warehouses");
    await expect(page.getByRole("heading", { name: "Armazéns" })).toBeVisible();

    const firstSwitchResponse = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/switch-warehouse") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("heading", { name: mockWarehouses[0].name }).click();
    await firstSwitchResponse;

    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });

    const firstSelectedWarehouseId = await getSelectedWarehouseViaCdp();

    expect(firstSelectedWarehouseId).toBe(mockWarehouses[0].id);

    await page.goto("/warehouses");

    const secondSwitchResponse = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/switch-warehouse") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("heading", { name: mockWarehouses[1].name }).click();
    await secondSwitchResponse;

    await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });

    const secondSelectedWarehouseId = await getSelectedWarehouseViaCdp();

    expect(secondSelectedWarehouseId).toBe(mockWarehouses[1].id);
    expect(secondSelectedWarehouseId).not.toBe(firstSelectedWarehouseId);

    const payloadWarehouseIds = switchWarehousePayloads
      .map((payload) => {
        try {
          const parsed = JSON.parse(payload) as { warehouseId?: string };
          return parsed.warehouseId ?? null;
        } catch {
          return null;
        }
      })
      .filter((id): id is string => id !== null);

    expect(payloadWarehouseIds).toContain(mockWarehouses[0].id);
    expect(payloadWarehouseIds).toContain(mockWarehouses[1].id);
  });
});
