# Stock Movement Endpoints

## Overview

Modulo de movimentacao de estoque para registrar entradas e saidas manuais (uso, presente, perda, dano, ajuste, compra). Movimentacoes de transferencia (`TRANSFER_IN`, `TRANSFER_OUT`) sao criadas automaticamente pelo modulo de Transfer e nao podem ser criadas manualmente.

Tipos de movimentacao e direcao:

| Tipo             | Direcao | Descricao                                |
| ---------------- | ------- | ---------------------------------------- |
| `USAGE`          | `OUT`   | Produto consumido/utilizado              |
| `GIFT`           | `OUT`   | Produto dado como presente               |
| `LOSS`           | `OUT`   | Produto perdido/extraviado               |
| `DAMAGE`         | `OUT`   | Produto danificado                       |
| `ADJUSTMENT_OUT` | `OUT`   | Ajuste manual de saida                   |
| `PURCHASE_IN`    | `IN`    | Entrada por compra                       |
| `ADJUSTMENT_IN`  | `IN`    | Ajuste manual de entrada                 |
| `TRANSFER_IN`    | `IN`    | _(automatico)_ Entrada por transferencia |
| `TRANSFER_OUT`   | `OUT`   | _(automatico)_ Saida por transferencia   |

Base path de aplicacao: `/stockshift`

Base path do recurso: `/api/stock-movements`

Base URL efetiva: `/stockshift/api/stock-movements`

Autenticacao: obrigatoria (JWT em cookie `accessToken` ou header `Authorization`)

## Authorization Matrix

- `POST /api/stock-movements` (application/json): `stock_movements:create`
- `POST /api/uploads/product-images/temp` (multipart/form-data): `stock_movements:create`
- `GET /api/stock-movements`: `stock_movements:read`
- `GET /api/stock-movements/{id}`: `stock_movements:read`
- `GET /api/stock-movements/warehouse-summary`: `stock_movements:read`

## Endpoints

### POST /api/stock-movements (application/json)

Cria uma movimentacao de estoque manual.

Request:

```json
{
  "type": "USAGE",
  "notes": "Produtos utilizados na producao do dia",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 5
    },
    {
      "newProduct": {
        "name": "Novo Produto Exemplo",
        "description": "Descricao do novo produto",
        "sku": "NP-001",
        "barcode": "1234567890123",
        "categoryId": "440e8400-e29b-41d4-a716-446655440000",
        "brandId": "330e8400-e29b-41d4-a716-446655440000",
        "minStock": 10,
        "maxStock": 100,
        "taxPercentage": 5.5,
        "unitOfMeasure": "UN",
        "costPrice": 1050,
        "sellingPrice": 2000,
        "isEnabled": true
      },
      "quantity": 10,
      "imageUploadId": "990e8400-e29b-41d4-a716-446655440000",
      "costPrice": 1050,
      "sellingPrice": 2000
    },
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 2.5,
      "manufacturedDate": "2026-04-01",
      "expirationDate": "2026-12-31",
      "costPrice": 500,
      "sellingPrice": 800
    }
  ]
}
```

Regras:

- `type` obrigatorio. Valores permitidos: `USAGE`, `GIFT`, `LOSS`, `DAMAGE`, `ADJUSTMENT_OUT`, `PURCHASE_IN`, `ADJUSTMENT_IN`.
- `type` **nao** pode ser `TRANSFER_IN` ou `TRANSFER_OUT` (retorna `400`).
- `items` obrigatorio e nao vazio.
- Cada item precisa possuir **obrigatoriamente** `productId` (UUID) ou `newProduct` (objeto `ProductRequest` com os dados do novo produto a ser salvo), mas nao ambos simultaneamente. Retorna validação se colocar ambos ou nenhum.
- `quantity` (positivo) obrigatorio para todos os itens.
- Para movimentos `IN` (`PURCHASE_IN`, `ADJUSTMENT_IN`), valores opcionais `manufacturedDate`, `expirationDate`, `costPrice` e `sellingPrice` podem ser repassados no item, tanto para `productId` quanto para `newProduct`.
- Para movimentos `OUT`, o sistema deduz automaticamente dos batches usando FIFO (batch mais antigo primeiro).
- Se a quantidade total disponivel no warehouse for insuficiente, retorna `400` com mensagem de estoque insuficiente.
- Para movimentos `IN` com `productId`, se qualquer data/preco de lote for informado, o sistema cria um novo batch com esses dados; se nenhum dado for informado, adiciona a quantidade ao primeiro batch existente do produto ou cria o primeiro batch se ainda nao houver lote.
- Se passado um `newProduct`, o sistema antes ira cadastrar tal produto no BD para em seguida criar o seu batch com as premissas deste estoque de entrada.
- `imageUploadId` e opcional e so pode ser usado junto com `newProduct`. Ele deve vir do endpoint de upload temporario e substitui o envio multipart da movimentacao.
- O `warehouseId` e determinado automaticamente pelo warehouse do usuario logado.
- Um codigo unico e gerado automaticamente (ex: `MOV-2026-0001`).

---

### POST /api/uploads/product-images/temp (multipart/form-data)

Faz upload temporario de uma imagem de produto inline antes do POST JSON da movimentacao.

Parts:

- `image` (Obrigatorio): arquivo `image/png`, `image/jpeg`, `image/jpg` ou `image/webp`.

Response (`201 Created`):

```json
{
  "success": true,
  "message": "Temporary product image uploaded successfully",
  "data": {
    "uploadId": "990e8400-e29b-41d4-a716-446655440000",
    "fileName": "produto.webp",
    "contentType": "image/webp",
    "sizeBytes": 105000
  }
}
```

O `uploadId` deve ser enviado no item `newProduct` da movimentacao. Uploads temporarios expiram e sao limpos automaticamente se nao forem consumidos.

Response (`201 Created`) comum:

```json
{
  "success": true,
  "message": "Stock movement created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "code": "MOV-2026-0001",
    "warehouseId": "770e8400-e29b-41d4-a716-446655440000",
    "warehouseName": "Deposito Central",
    "type": "USAGE",
    "direction": "OUT",
    "notes": "Produtos utilizados na producao do dia",
    "createdByUserId": "880e8400-e29b-41d4-a716-446655440000",
    "referenceType": null,
    "referenceId": null,
    "createdAt": "2026-03-01T13:00:00Z",
    "updatedAt": "2026-03-01T13:00:00Z",
    "items": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productName": "Cimento CP-II",
        "productSku": "CIM-001",
        "batchId": "cc0e8400-e29b-41d4-a716-446655440000",
        "batchCode": "BATCH-2026-01",
        "quantity": 5
      },
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "productId": "660e8400-e29b-41d4-a716-446655440001",
        "productName": "Argamassa AC-III",
        "productSku": "ARG-002",
        "batchId": "dd0e8400-e29b-41d4-a716-446655440000",
        "batchCode": "BATCH-2026-02",
        "quantity": 2.5
      }
    ]
  }
}
```

> **Nota sobre FIFO:** Quando um produto possui multiplos batches, a quantidade sera deduzida do batch mais antigo primeiro. Se um batch nao tiver quantidade suficiente, o restante e deduzido do proximo batch. Isso pode resultar em mais `items` no response do que no request (ex: pediu 10 unidades de um produto, mas o batch antigo tinha 7 e o novo 3 — o response tera 2 items para esse produto).

---

### GET /api/stock-movements

Lista movimentacoes com filtros opcionais e paginacao.

Query parameters:

| Parametro     | Tipo              | Obrigatorio | Descricao                                           |
| ------------- | ----------------- | ----------- | --------------------------------------------------- |
| `warehouseId` | UUID              | Nao         | Filtra por warehouse (padrao: warehouse do usuario) |
| `productId`   | UUID              | Nao         | Filtra movimentacoes que contenham o produto        |
| `type`        | StockMovementType | Nao         | Filtra por tipo (ex: `USAGE`, `GIFT`)               |
| `dateFrom`    | ISO DateTime      | Nao         | Data/hora inicial (ex: `2026-03-01T00:00:00`)       |
| `dateTo`      | ISO DateTime      | Nao         | Data/hora final (ex: `2026-03-31T23:59:59`)         |
| `page`        | int               | Nao         | Numero da pagina (0-indexed, padrao: 0)             |
| `size`        | int               | Nao         | Tamanho da pagina (padrao: 20)                      |
| `sort`        | string            | Nao         | Campo e direcao (ex: `createdAt,desc`)              |

Exemplo de chamada:

```
GET /stockshift/api/stock-movements?type=USAGE&dateFrom=2026-03-01T00:00:00&dateTo=2026-03-31T23:59:59&page=0&size=10&sort=createdAt,desc
```

Response (`200 OK`):

```json
{
  "success": true,
  "message": "Stock movements retrieved successfully",
  "data": {
    "content": [
      {
        "id": "...",
        "code": "MOV-2026-0001",
        "warehouseId": "...",
        "warehouseName": "Deposito Central",
        "type": "USAGE",
        "direction": "OUT",
        "notes": "...",
        "createdByUserId": "...",
        "referenceType": null,
        "referenceId": null,
        "createdAt": "2026-03-01T13:00:00Z",
        "updatedAt": "2026-03-01T13:00:00Z",
        "items": [...]
      }
    ],
    "pageable": { ... },
    "totalElements": 42,
    "totalPages": 5,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

---

### GET /api/stock-movements/{id}

Retorna movimentacao por ID.

Response (`200 OK`): mesmo formato do objeto `StockMovementResponse` no POST.

---

### GET /api/stock-movements/warehouse-summary

Retorna relatorio resumido de movimentacoes agrupado por warehouse e tipo.

Query parameters:

| Parametro  | Tipo         | Obrigatorio | Descricao                    |
| ---------- | ------------ | ----------- | ---------------------------- |
| `dateFrom` | ISO DateTime | Nao         | Data/hora inicial do periodo |
| `dateTo`   | ISO DateTime | Nao         | Data/hora final do periodo   |

Exemplo de chamada:

```
GET /stockshift/api/stock-movements/warehouse-summary?dateFrom=2026-03-01T00:00:00&dateTo=2026-03-31T23:59:59
```

Response (`200 OK`):

```json
{
  "success": true,
  "message": "Warehouse summary retrieved successfully",
  "data": {
    "warehouses": [
      {
        "warehouseId": "770e8400-e29b-41d4-a716-446655440000",
        "warehouseName": "Deposito Central",
        "movementsByType": [
          {
            "type": "USAGE",
            "direction": "OUT",
            "totalQuantity": 150.0,
            "count": 12
          },
          {
            "type": "GIFT",
            "direction": "OUT",
            "totalQuantity": 25.0,
            "count": 3
          },
          {
            "type": "PURCHASE_IN",
            "direction": "IN",
            "totalQuantity": 500.0,
            "count": 5
          }
        ],
        "totalIn": 500.0,
        "totalOut": 175.0
      },
      {
        "warehouseId": "880e8400-e29b-41d4-a716-446655440000",
        "warehouseName": "Filial Natal",
        "movementsByType": [],
        "totalIn": 0,
        "totalOut": 0
      }
    ]
  }
}
```

## Campos do response `StockMovementResponse`

| Campo             | Tipo     | Descricao                                                       |
| ----------------- | -------- | --------------------------------------------------------------- |
| `id`              | UUID     | ID da movimentacao                                              |
| `code`            | string   | Codigo unico gerado (ex: `MOV-2026-0001`)                       |
| `warehouseId`     | UUID     | ID do warehouse                                                 |
| `warehouseName`   | string   | Nome do warehouse                                               |
| `type`            | string   | Tipo da movimentacao (ver tabela acima)                         |
| `direction`       | string   | `IN` ou `OUT`                                                   |
| `notes`           | string?  | Observacoes opcionais                                           |
| `createdByUserId` | UUID     | ID do usuario que criou                                         |
| `referenceType`   | string?  | Tipo da referencia (ex: `TRANSFER` para movimentos automaticos) |
| `referenceId`     | UUID?    | ID do recurso referenciado (ex: ID da transferencia)            |
| `createdAt`       | ISO 8601 | Data/hora de criacao                                            |
| `updatedAt`       | ISO 8601 | Data/hora da ultima atualizacao                                 |
| `items`           | array    | Lista de items da movimentacao                                  |

## Campos do response `StockMovementItemResponse`

| Campo         | Tipo       | Descricao                          |
| ------------- | ---------- | ---------------------------------- |
| `id`          | UUID       | ID do item                         |
| `productId`   | UUID       | ID do produto                      |
| `productName` | string     | Nome do produto (snapshot)         |
| `productSku`  | string?    | SKU do produto (snapshot)          |
| `batchId`     | UUID       | ID do batch afetado                |
| `batchCode`   | string     | Codigo do batch afetado (snapshot) |
| `quantity`    | BigDecimal | Quantidade movimentada neste batch |

## Integracao com Transfer

Quando uma transferencia e executada (`POST /api/transfers/{id}/execute`), o sistema cria automaticamente um `StockMovement` do tipo `TRANSFER_OUT` no warehouse de origem.

Quando uma transferencia e validada com sucesso (`POST /api/transfers/{id}/complete-validation`), o sistema cria automaticamente um `StockMovement` do tipo `TRANSFER_IN` no warehouse de destino.

Esses movimentos possuem:

- `referenceType`: `"TRANSFER"`
- `referenceId`: ID da transferencia

Isso permite rastrear a origem da movimentacao e cruzar com o modulo de transferencias.

## Error Handling

- `400 Bad Request`:
  - Tipo invalido (ex: `TRANSFER_IN`, `TRANSFER_OUT` via endpoint manual).
  - Payload invalido (campos obrigatorios ausentes, quantidade nao positiva).
  - Estoque insuficiente para movimentos `OUT`.
- `403 Forbidden`: usuario sem permissao `stock_movements:create` ou `stock_movements:read`.
- `404 Not Found`: movimentacao ou produto inexistente.

Exemplo de erro de estoque insuficiente:

```json
{
  "success": false,
  "message": "Insufficient stock for product 'Cimento CP-II'. Available: 3.0000, Required: 10.0000"
}
```
