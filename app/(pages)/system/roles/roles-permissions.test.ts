import { describe, expect, it } from "vitest";
import {
  groupPermissionsByResource,
  normalizePermission,
} from "./roles-permissions";
import { Permission } from "./roles.types";

describe("roles permission normalization", () => {
  it("parses code-based permissions into resource, action and scope", () => {
    const normalized = normalizePermission({
      id: "perm-1",
      code: "products:analyze_image",
      description: "products:analyze_image",
    } satisfies Permission);

    expect(normalized.resource).toBe("products");
    expect(normalized.action).toBe("analyze_image");
    expect(normalized.scope).toBe("all");
    expect(normalized.resourceDisplayName).toBe("Products");
    expect(normalized.actionDisplayName).toBe("Analyze Image");
    expect(normalized.scopeDisplayName).toBe("All");
  });

  it("creates valid accordion groups for code-only payloads", () => {
    const grouped = groupPermissionsByResource([
      {
        id: "perm-1",
        code: "products:create",
        description: "products:create",
      } satisfies Permission,
      {
        id: "perm-2",
        code: "products:update",
        description: "products:update",
      } satisfies Permission,
      {
        id: "perm-3",
        code: "users:read",
        description: "users:read",
      } satisfies Permission,
    ]);

    expect(Array.from(grouped.keys())).toEqual(["Products", "Users"]);
    expect(grouped.get("Products")?.length).toBe(2);
    expect(grouped.get("Users")?.length).toBe(1);
  });
});
