import { Permission } from "./roles.types";

const DEFAULT_SCOPE = "all";
const FALLBACK_RESOURCE = "other";
const FALLBACK_ACTION = "read";

const toDisplayLabel = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const parseCode = (
  code?: string | null,
): { resource?: string; action?: string; scope?: string } => {
  if (!code) return {};

  const parts = code.split(":").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return {};

  if (parts.length === 1) {
    return { resource: parts[0] };
  }

  if (parts.length === 2) {
    return { resource: parts[0], action: parts[1], scope: DEFAULT_SCOPE };
  }

  return {
    resource: parts[0],
    action: parts[1],
    scope: parts.slice(2).join(":"),
  };
};

const pickFirst = (...values: Array<string | null | undefined>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const normalizePermission = (permission: Permission): Permission => {
  const parsed = parseCode(permission.code);

  const resource = pickFirst(
    permission.resource,
    parsed.resource,
    FALLBACK_RESOURCE,
  );
  const action = pickFirst(permission.action, parsed.action, FALLBACK_ACTION);
  const scope = pickFirst(permission.scope, parsed.scope, DEFAULT_SCOPE);

  return {
    ...permission,
    resource,
    action,
    scope,
    resourceDisplayName: pickFirst(
      permission.resourceDisplayName,
      toDisplayLabel(resource),
    ),
    actionDisplayName: pickFirst(
      permission.actionDisplayName,
      toDisplayLabel(action),
    ),
    scopeDisplayName: pickFirst(
      permission.scopeDisplayName,
      toDisplayLabel(scope),
    ),
    description: pickFirst(permission.description, permission.code),
  };
};

export const groupPermissionsByResource = (
  permissions: Permission[],
): Map<string, Permission[]> => {
  const map = new Map<string, Permission[]>();

  permissions.forEach((permission) => {
    const normalizedPermission = normalizePermission(permission);
    const key = pickFirst(
      normalizedPermission.resourceDisplayName,
      normalizedPermission.resource,
      "Other",
    );
    const existing = map.get(key) || [];
    map.set(key, [...existing, normalizedPermission]);
  });

  return map;
};
