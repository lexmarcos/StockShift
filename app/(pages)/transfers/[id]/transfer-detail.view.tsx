import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, FileText, Truck, AlertCircle, CheckCircle, XCircle, Edit } from "lucide-react";
import { TransferDetailViewProps } from "./transfer-detail.types";
import { TransferStatus } from "../transfers.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export const TransferDetailView: React.FC<TransferDetailViewProps> = ({
  isLoading,
  transfer,
  isSource,
  isDestination,
  isExecuting,
  isCancelling,
  isValidating,
  onExecute,
  onCancel,
  onStartValidation,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-neutral-500">
        Carregando detalhes...
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-neutral-400">Transferência não encontrada</div>
        <Link href="/transfers">
          <Button variant="outline">Voltar para Transferências</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.DRAFT:
        return <Badge variant="outline" className="bg-neutral-800 text-neutral-400 border-neutral-700">RASCUNHO</Badge>;
      case TransferStatus.IN_TRANSIT:
        return <Badge className="bg-blue-600/20 text-blue-500 border-blue-600/50">EM TRÂNSITO</Badge>;
      case TransferStatus.IN_VALIDATION:
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">EM VALIDAÇÃO</Badge>;
      case TransferStatus.COMPLETED:
        return <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-600/50">CONCLUÍDA</Badge>;
      case TransferStatus.CANCELLED:
        return <Badge className="bg-rose-600/20 text-rose-500 border-rose-600/50">CANCELADA</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.IN_TRANSIT: return "border-l-blue-600";
      case TransferStatus.IN_VALIDATION: return "border-l-amber-500";
      case TransferStatus.COMPLETED: return "border-l-emerald-600";
      case TransferStatus.CANCELLED: return "border-l-rose-600";
      default: return "border-l-neutral-600";
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-6">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/transfers" 
            className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Transferências
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">{transfer.code}</h1>
                {getStatusBadge(transfer.status)}
              </div>
              <p className="text-neutral-400 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Criado em {new Date(transfer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Route Card */}
        <Card className={`bg-[#171717] border-neutral-800 border-l-4 ${getStatusColor(transfer.status)} rounded-[4px]`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-neutral-400" />
              Rota de Transferência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">Origem</span>
                <div className="text-lg font-medium text-white">{transfer.sourceWarehouseName}</div>
                {isSource && <span className="text-xs text-blue-500 font-mono mt-1 block">SEU WAREHOUSE</span>}
              </div>
              
              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="w-6 h-6 text-neutral-600" />
              </div>
              
              <div className="flex-1 md:text-right">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">Destino</span>
                <div className="text-lg font-medium text-white">{transfer.destinationWarehouseName}</div>
                {isDestination && <span className="text-xs text-blue-500 font-mono mt-1 block">SEU WAREHOUSE</span>}
              </div>
            </div>

            {transfer.notes && (
              <>
                <Separator className="my-6 bg-neutral-800" />
                <div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-2">
                    <FileText className="w-3 h-3 inline mr-1" />
                    Observações
                  </span>
                  <p className="text-neutral-300 text-sm leading-relaxed">{transfer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
          <CardHeader>
            <CardTitle className="text-lg">Itens da Transferência</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-500">Produto</TableHead>
                  <TableHead className="text-neutral-500">Lote</TableHead>
                  <TableHead className="text-right text-neutral-500">Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item) => (
                  <TableRow key={item.id} className="border-neutral-800 hover:bg-neutral-800/50">
                    <TableCell className="font-medium text-white">
                      {item.productName || "Produto Desconhecido"}
                    </TableCell>
                    <TableCell className="text-neutral-400 font-mono text-xs">
                      {item.batchCode || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-white tracking-tighter">
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-neutral-800 p-4 md:p-6 md:ml-[240px] z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          {/* Source Actions */}
          {isSource && transfer.status === TransferStatus.DRAFT && (
            <>
              <Link href={`/transfers/${transfer.id}/edit`}>
                <Button variant="ghost" className="text-neutral-400 hover:text-white uppercase tracking-wide">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={onCancel} 
                disabled={isCancelling}
                className="border-neutral-700 text-neutral-300 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900"
              >
                {isCancelling ? "Cancelando..." : "CANCELAR"}
              </Button>
              <Button 
                onClick={onExecute} 
                disabled={isExecuting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase"
              >
                {isExecuting ? "Processando..." : "EXECUTAR TRANSFERÊNCIA"}
              </Button>
            </>
          )}

          {isSource && transfer.status === TransferStatus.IN_TRANSIT && (
             <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isCancelling}
                className="border-neutral-700 text-neutral-300 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900"
              >
                {isCancelling ? "Cancelando..." : "CANCELAR TRANSFERÊNCIA"}
              </Button>
          )}

          {/* Destination Actions */}
          {isDestination && transfer.status === TransferStatus.IN_TRANSIT && (
             <Button 
                onClick={onStartValidation} 
                disabled={isValidating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase"
              >
                {isValidating ? "Iniciando..." : "INICIAR VALIDAÇÃO"}
              </Button>
          )}

          {isDestination && transfer.status === TransferStatus.IN_VALIDATION && (
             <Link href={`/transfers/${transfer.id}/validate`}>
               <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-wide uppercase"
                >
                  CONTINUAR VALIDAÇÃO
                </Button>
             </Link>
          )}

          {/* Completed State */}
          {transfer.status === TransferStatus.COMPLETED && (
            <>
              <div className="text-emerald-500 flex items-center gap-2 text-sm font-medium px-4">
                <CheckCircle className="w-5 h-5" />
                Transferência Concluída
              </div>
              {isDestination && (
                <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white uppercase tracking-wide">
                  VER RELATÓRIO
                </Button>
              )}
            </>
          )}

           {/* Cancelled State */}
           {transfer.status === TransferStatus.CANCELLED && (
            <div className="text-rose-500 flex items-center gap-2 text-sm font-medium px-4">
              <XCircle className="w-5 h-5" />
              Transferência Cancelada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
