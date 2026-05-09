# Warehouse Endpoints

## Overview

Gerencia warehouses do tenant atual.

Base path de aplicacao: `/stockshift`

Base path do recurso: `/api/warehouses`

Base URL efetiva: `/stockshift/api/warehouses`

Autenticacao: obrigatoria.

## Authorization Matrix

- `POST /api/warehouses`: `warehouses:create` ou `ROLE_ADMIN`
- `GET /api/warehouses`: `warehouses:read` ou `ROLE_ADMIN`
- `GET /api/warehouses/stock-summary`: `warehouses:read` ou `ROLE_ADMIN`
- `GET /api/warehouses/{id}`: `warehouses:read` ou `ROLE_ADMIN`
- `GET /api/warehouses/active/{isActive}`: `warehouses:read` ou `ROLE_ADMIN`
- `PUT /api/warehouses/{id}`: `warehouses:update` ou `ROLE_ADMIN`
- `DELETE /api/warehouses/{id}`: `warehouses:delete` ou `ROLE_ADMIN`
- `GET /api/warehouses/{id}/products`: `warehouses:read` + `warehouseGuard.isCurrent` ou `ROLE_ADMIN`

## WarehouseRequest

Campos:

- `name` (obrigatorio, max 255)
- `city` (obrigatorio, max 100)
- `state` (obrigatorio, 2 letras maiusculas)
- `code` (opcional, max 20, `A-Z0-9-`)
- `address` (opcional, max 500)
- `isActive` (opcional, default `true`)

Exemplo:

```json
{
  "name": "Main Warehouse",
  "city": "New York",
  "state": "NY",
  "code": "MAIN-NY",
  "address": "123 Storage St",
  "isActive": true
}
```

Se `code` nao for enviado, o backend gera automaticamente com base em nome/cidade.

## Endpoints

### POST /api/warehouses
Cria warehouse para o tenant atual.

Retorna `201 Created`.

### GET /api/warehouses
Lista warehouses visiveis para o usuario atual.

- Admin (`ROLE_ADMIN`) ve todas do tenant.
- Usuario sem full-access ve apenas warehouses permitidas.

### GET /api/warehouses/stock-summary
Retorna resumo de estoque por warehouse acessivel.

Response (lista de `WarehouseStockSummaryResponse`):

- `warehouseId` (UUID)
- `productCount` (Long)
- `batchCount` (Long)
- `totalQuantity` (BigDecimal)

### GET /api/warehouses/{id}
Retorna warehouse por ID com validacao de acesso.

### GET /api/warehouses/active/{isActive}
Filtra por status ativo/inativo.

### PUT /api/warehouses/{id}
Atualiza dados da warehouse.

### DELETE /api/warehouses/{id}
Remove warehouse.

### GET /api/warehouses/{id}/products
Retorna produtos com estoque agregado no warehouse.

Requer adicionalmente `warehouseGuard.isCurrent(#id)` — o warehouse
solicitado deve ser o mesmo do contexto do token JWT.

Query params:

- `search` (opcional) — busca por nome, SKU ou barcode do produto
- `page` — pagina (zero-based)
- `size` — tamanho da pagina
- `sort` — campo,direcao (ex: `name,asc`)

Sort permitido apenas em:

- `name`
- `sku`
- `barcode`
- `active`
- `createdAt`
- `updatedAt`

Exemplo:

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/stockshift/api/warehouses/{id}/products?page=0&size=20&sort=name,asc"
```

## Error Handling (comum)

- `400 Bad Request`: payload invalido.
- `403 Forbidden`: usuario sem acesso ao warehouse.
- `404 Not Found`: warehouse inexistente.
- `409 Conflict`: conflitos de integridade/regras de negocio.
