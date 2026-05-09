# Transfer Endpoints

## Overview

Fluxo de transferencia entre warehouses:

- `DRAFT -> IN_TRANSIT -> PENDING_VALIDATION -> COMPLETED`
- `DRAFT -> IN_TRANSIT -> PENDING_VALIDATION -> COMPLETED_WITH_DISCREPANCY`
- `DRAFT -> CANCELLED`
- `IN_TRANSIT -> CANCELLED`

Base path de aplicacao: `/stockshift`

Base path do recurso: `/api/transfers`

Base URL efetiva: `/stockshift/api/transfers`

Autenticacao: obrigatoria (JWT em cookie `accessToken` ou header `Authorization`)

## Authorization Matrix

- `POST /api/transfers`: `transfers:create`
- `GET /api/transfers`: `transfers:read`
- `GET /api/transfers/{id}`: `transfers:read`
- `PATCH /api/transfers/{id}`: `transfers:update`
- `DELETE /api/transfers/{id}`: `transfers:delete`
- `POST /api/transfers/{id}/execute`: `transfers:execute`
- `POST /api/transfers/{id}/start-validation`: `transfers:validate`
- `POST /api/transfers/{id}/scan`: `transfers:validate`
- `POST /api/transfers/{id}/complete-validation`: `transfers:validate`
- `GET /api/transfers/{id}/discrepancy-report`: `transfers:read`
- `GET /api/transfers/{id}/validation-logs`: `transfers:read`

## Endpoints

### POST /api/transfers
Cria transferencia em `DRAFT`.

Request:

```json
{
  "destinationWarehouseId": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Reposicao mensal",
  "items": [
    {
      "sourceBatchId": "660e8400-e29b-41d4-a716-446655440002",
      "quantity": 10.5
    }
  ]
}
```

Regras:

- `destinationWarehouseId` obrigatorio.
- `items` obrigatorio e nao vazio.
- origem e destino devem ser diferentes.

### GET /api/transfers
Lista transferencias com filtros opcionais:

- `status`
- `sourceWarehouseId`
- `destinationWarehouseId`
- `page`, `size`, `sort`

### GET /api/transfers/{id}
Retorna transferencia por ID.

### PATCH /api/transfers/{id}
Atualiza transferencia (somente em `DRAFT`).

Request:

```json
{
  "notes": "Observacao atualizada",
  "items": [
    {
      "sourceBatchId": "660e8400-e29b-41d4-a716-446655440002",
      "quantity": 15
    }
  ]
}
```

### DELETE /api/transfers/{id}
Cancela transferencia.

- Em `IN_TRANSIT`, `reason` e obrigatorio.

Request opcional:

```json
{
  "reason": "Erro de separacao"
}
```

### POST /api/transfers/{id}/execute
Move status para `IN_TRANSIT` e gera lancamentos de saida no ledger.

### POST /api/transfers/{id}/start-validation
Move status para `PENDING_VALIDATION`.

### POST /api/transfers/{id}/scan
Registra leitura de barcode na validacao.

Request:

```json
{
  "barcode": "7891234567890"
}
```

### POST /api/transfers/{id}/complete-validation
Finaliza validacao, gera entradas no destino e conclui em:

- `COMPLETED`, ou
- `COMPLETED_WITH_DISCREPANCY`

### GET /api/transfers/{id}/discrepancy-report
Retorna relatorio de discrepancia.

- Disponivel apenas quando status for `COMPLETED_WITH_DISCREPANCY`.

### GET /api/transfers/{id}/validation-logs
Retorna logs de scan da transferencia.

## Error Handling (relevante para transfer)

- `400 Bad Request`: validacoes de payload/regra de negocio.
- `403 Forbidden`: warehouse sem acesso para a acao.
- `404 Not Found`: transferencia, batch ou warehouse inexistente.
- `409 Conflict`:
  - transicao de estado invalida (`IllegalStateException`)
  - violacao de constraints de banco (`DataIntegrityViolationException`)

Exemplo de conflito de constraint:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Transfer code already exists. Please retry the operation."
}
```
