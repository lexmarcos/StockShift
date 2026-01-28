"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserModal } from "@/components/users/user-modal";
import {
  Plus,
  Search,
  Pencil,
  UserX,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Users,
  Shield,
  Loader2,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SystemUser, Role, SortConfig } from "./system.types";
import { CreateUserFormData, UpdateUserFormData } from "./system.schema";

interface Warehouse {
  id: string;
  name: string;
}

interface SystemViewProps {
  // Auth
  isAdmin: boolean;
  isAuthLoading: boolean;

  // Data
  users: SystemUser[];
  roles: Role[];
  warehouses: Warehouse[];
  isLoading: boolean;
  isRolesLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortConfig: SortConfig;
  handleSort: (key: SortConfig["key"]) => void;

  // Modal
  isModalOpen: boolean;
  selectedUser: SystemUser | null;
  openCreateModal: () => void;
  openEditModal: (user: SystemUser) => void;
  closeModal: () => void;

  // Forms
  createForm: UseFormReturn<CreateUserFormData>;
  updateForm: UseFormReturn<UpdateUserFormData>;
  onCreateSubmit: (data: CreateUserFormData) => void;
  onUpdateSubmit: (data: UpdateUserFormData) => void;
  isSubmitting: boolean;

  // Delete
  userToDelete: SystemUser | null;
  openDeleteDialog: (user: SystemUser) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
}

export const SystemView = ({
  isAdmin,
  isAuthLoading,
  users,
  roles,
  warehouses,
  isLoading,
  isRolesLoading,
  error,
  searchQuery,
  setSearchQuery,
  sortConfig,
  handleSort,
  isModalOpen,
  selectedUser,
  openCreateModal,
  openEditModal,
  closeModal,
  createForm,
  updateForm,
  onCreateSubmit,
  onUpdateSubmit,
  isSubmitting,
  userToDelete,
  openDeleteDialog,
  closeDeleteDialog,
  confirmDelete,
  isDeleting,
}: SystemViewProps) => {
  // Loading state
  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Non-admin redirect (handled in model, but show nothing while redirecting)
  if (!isAdmin) {
    return null;
  }

  const SortIcon = ({ columnKey }: { columnKey: SortConfig["key"] }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Gerenciamento do Sistema
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie usuários e permissões do seu tenant
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          Erro ao carregar usuários. Tente novamente.
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "Nenhum usuário encontrado para esta busca"
              : "Nenhum usuário cadastrado"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Nome
                    <SortIcon columnKey="fullName" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    Email
                    <SortIcon columnKey="email" />
                  </div>
                </TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge
                          key={role.id}
                          variant={role.name === "ADMIN" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.warehouseName || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "outline"}
                      className={
                        user.isActive
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "text-muted-foreground"
                      }
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(user)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditMode={!!selectedUser}
        createForm={createForm}
        updateForm={updateForm}
        onCreateSubmit={onCreateSubmit}
        onUpdateSubmit={onUpdateSubmit}
        roles={roles}
        warehouses={warehouses}
        isSubmitting={isSubmitting}
        isRolesLoading={isRolesLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o usuário{" "}
              <strong>{userToDelete?.fullName}</strong>? O usuário não poderá
              mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
