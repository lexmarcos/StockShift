import { Role, SystemUser } from "./system.types";

export const MOCK_ROLES: Role[] = [
  { id: "role-1", name: "ADMIN", description: "Acesso total ao sistema" },
  { id: "role-2", name: "GERENTE", description: "Gerencia operações" },
  { id: "role-3", name: "VENDEDOR", description: "Realiza vendas" },
  { id: "role-4", name: "ESTOQUISTA", description: "Gerencia estoque" },
];

export const MOCK_USERS: SystemUser[] = [
  {
    id: "user-1",
    email: "admin@empresa.com",
    fullName: "Administrador",
    roles: [MOCK_ROLES[0]],
    warehouseId: null,
    warehouseName: null,
    isActive: true,
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "user-2",
    email: "joao.silva@empresa.com",
    fullName: "João Silva",
    roles: [MOCK_ROLES[2], MOCK_ROLES[3]],
    warehouseId: "wh-1",
    warehouseName: "Matriz",
    isActive: true,
    createdAt: "2025-01-15T14:30:00Z",
  },
  {
    id: "user-3",
    email: "maria.santos@empresa.com",
    fullName: "Maria Santos",
    roles: [MOCK_ROLES[1]],
    warehouseId: "wh-2",
    warehouseName: "Filial Centro",
    isActive: true,
    createdAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "user-4",
    email: "pedro.costa@empresa.com",
    fullName: "Pedro Costa",
    roles: [MOCK_ROLES[3]],
    warehouseId: "wh-1",
    warehouseName: "Matriz",
    isActive: false,
    createdAt: "2025-02-10T11:00:00Z",
  },
];

export const mockDelay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));
