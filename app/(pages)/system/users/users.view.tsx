"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageContainer } from "@/components/ui/page-container";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Users,
  Loader2,
  Plus,
  Search,
  AlertTriangle,
  MoreHorizontal,
  Shield,
  Warehouse,
  Copy,
  Check,
  Clock,
  Pencil,
  UserX,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { UsersViewProps, User } from "./users.types";

const isCurrentUser = (user: User, currentUserId: UsersViewProps["currentUserId"]) =>
  user.id === currentUserId;
import { cn } from "@/lib/utils";

const DesktopActions = ({
  user,
  currentUserId,
  openEditModal,
  toggleUserStatus,
}: {
  user: User;
  currentUserId: UsersViewProps["currentUserId"];
  openEditModal: (user: User) => void;
  toggleUserStatus: (user: User) => void;
}) => (
  <div className="flex justify-end gap-1">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openEditModal(user)}
      title="Editar usuário"
      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
    >
      <Pencil className="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleUserStatus(user)}
      disabled={isCurrentUser(user, currentUserId)}
      title={
        isCurrentUser(user, currentUserId)
          ? "Não é possível desativar seu próprio usuário"
          : user.isActive
          ? "Desativar usuário"
          : "Ativar usuário"
      }
      className={cn(
        "size-8 rounded-[4px] disabled:opacity-30",
        user.isActive
          ? "text-neutral-500 hover:bg-amber-950/20 hover:text-amber-500"
          : "text-neutral-500 hover:bg-emerald-950/20 hover:text-emerald-500"
      )}
    >
      {user.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
    </Button>
  </div>
);

const MobileActions = ({
  user,
  currentUserId,
  openEditModal,
  toggleUserStatus,
}: {
  user: User;
  currentUserId: UsersViewProps["currentUserId"];
  openEditModal: (user: User) => void;
  toggleUserStatus: (user: User) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl"
    >
      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Ações do Usuário
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-neutral-800" />
      <DropdownMenuItem
        onClick={() => openEditModal(user)}
        className="cursor-pointer focus:bg-neutral-800 focus:text-white"
      >
        <Pencil className="mr-2 size-3.5" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => toggleUserStatus(user)}
        disabled={isCurrentUser(user, currentUserId)}
        className={cn(
          "cursor-pointer",
          isCurrentUser(user, currentUserId)
            ? "cursor-not-allowed opacity-50"
            : user.isActive
            ? "text-amber-500 focus:bg-amber-950/20 focus:text-amber-400"
            : "text-emerald-500 focus:bg-emerald-950/20 focus:text-emerald-400"
        )}
      >
        {user.isActive ? (
          <>
            <UserX className="mr-2 size-3.5" />
            Desativar
          </>
        ) : (
          <>
            <UserCheck className="mr-2 size-3.5" />
            Ativar
          </>
        )}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const RoleBadges = ({ userRoles }: { userRoles: string[] }) => {
  const maxVisible = 2;
  const visible = userRoles.slice(0, maxVisible);
  const remaining = userRoles.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className={cn(
            "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            role === "ADMIN"
              ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
              : "border-neutral-700 bg-neutral-800 text-neutral-400"
          )}
        >
          {role}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge
          variant="outline"
          className="rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500"
        >
          +{remaining}
        </Badge>
      )}
    </div>
  );
};

const WarehouseBadges = ({ userWarehouses }: { userWarehouses: string[] }) => {
  const maxVisible = 2;
  const visible = userWarehouses.slice(0, maxVisible);
  const remaining = userWarehouses.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((warehouse) => (
        <Badge
          key={warehouse}
          variant="outline"
          className="rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400"
        >
          {warehouse}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge
          variant="outline"
          className="rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500"
        >
          +{remaining}
        </Badge>
      )}
    </div>
  );
};

const StatusBadge = ({ user }: { user: User }) => {
  if (!user.isActive) {
    return (
      <Badge
        variant="outline"
        className="rounded-[2px] border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
      >
        INATIVO
      </Badge>
    );
  }

  if (user.mustChangePassword) {
    return (
      <Badge
        variant="outline"
        className="rounded-[2px] border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500"
      >
        SENHA TEMP.
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-[2px] border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500"
    >
      ATIVO
    </Badge>
  );
};

export const UsersView = ({
  users,
  isLoading,
  error,
  searchQuery,
  onSearchChange,
  isCreateModalOpen,
  openCreateModal,
  closeCreateModal,
  isEditModalOpen,
  selectedUser,
  openEditModal,
  closeEditModal,
  roles,
  warehouses,
  isLoadingRoles,
  isLoadingWarehouses,
  createForm,
  editForm,
  onCreateSubmit,
  onEditSubmit,
  isSubmitting,
  temporaryPassword,
  createdUserEmail,
  closePasswordModal,
  isAdmin,
  currentUserId,
  toggleUserStatus,
  isLoadingAdmin,
}: UsersViewProps) => {
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopyPassword = async () => {
    if (temporaryPassword) {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCurrentUser = (user: User) => user.id === currentUserId;

  // Desktop actions - visible buttons

  // Mobile actions - dropdown menu




  // Access denied state
  if (!isLoadingAdmin && !isAdmin) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tighter text-white">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Sistema</p>
        </div>
        <ErrorState
          title="Acesso Negado"
          description="Você não tem permissão para acessar esta página."
        />
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter text-white">
              Usuários
            </h1>
            <p className="mt-1 text-sm text-neutral-500">Sistema</p>
          </div>
          <div className="w-full md:w-auto">
            <Button
              onClick={openCreateModal}
              className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] md:w-auto"
            >
              <Plus className="mr-2 size-4" strokeWidth={2.5} />
              NOVO USUÁRIO
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
          <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
            <div className="text-neutral-500 absolute left-3">
              <Search className="size-3.5" strokeWidth={2.5} />
            </div>
            <Input
              placeholder="Pesquisar por nome ou email…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 hover:border-neutral-700"
            />
          </div>
        </div>

        <SectionLabel icon={Users} className="mb-4">
          Lista de Usuários
        </SectionLabel>

        {/* Data Display */}
        {isLoading ? (
          <LoadingState message="Carregando usuários…" />
        ) : error ? (
          <ErrorState
            title="Falha na conexão"
            description="Não foi possível carregar a lista de usuários."
          />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "Nenhum resultado encontrado" : "Nenhum usuário cadastrado"}
            description={
              searchQuery
                ? "Tente ajustar seus termos de busca."
                : "Comece adicionando usuários ao sistema."
            }
            action={
              searchQuery
                ? { label: "LIMPAR BUSCA", onClick: () => onSearchChange("") }
                : { label: "NOVO USUÁRIO", onClick: openCreateModal }
            }
          />
        ) : (
                <>
                  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                    <Table>
                      <TableHeader className="bg-neutral-900">
                        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Nome / Email
                          </TableHead>
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Roles
                          </TableHead>
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Armazéns
                          </TableHead>
                          <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Status
                          </TableHead>
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Último Login
                          </TableHead>
                          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow
                            key={user.id}
                            className={cn(
                              "group border-b border-neutral-800/50 hover:bg-neutral-800/50",
                              !user.isActive && "opacity-50"
                            )}
                          >
                            <TableCell className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-white">
                                  {user.fullName}
                                  {isCurrentUser(user) && (
                                    <span className="ml-2 text-[10px] text-blue-500">(você)</span>
                                  )}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {user.email}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <RoleBadges userRoles={user.roles} />
                            </TableCell>
                            <TableCell className="py-3">
                              <WarehouseBadges userWarehouses={user.warehouses} />
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <StatusBadge user={user} />
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Clock className="size-3" />
                                {formatDate(user.lastLogin)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <DesktopActions user={user} currentUserId={currentUserId} openEditModal={openEditModal} toggleUserStatus={toggleUserStatus} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="grid gap-3 md:hidden">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700",
                          !user.isActive && "opacity-50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <h3 className="font-semibold text-white">
                              {user.fullName}
                              {isCurrentUser(user) && (
                                <span className="ml-2 text-[10px] text-blue-500">(você)</span>
                              )}
                            </h3>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge user={user} />
                            <MobileActions user={user} currentUserId={currentUserId} openEditModal={openEditModal} toggleUserStatus={toggleUserStatus} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <Shield className="size-3 text-neutral-600" />
                            <RoleBadges userRoles={user.roles} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="size-3 text-neutral-600" />
                            <WarehouseBadges userWarehouses={user.warehouses} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
                          <Clock className="size-3" />
                          Último login: {formatDate(user.lastLogin)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
      </PageContainer>

      {/* Create User Modal */}
      <ResponsiveModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal();
        }}
        title="Novo Usuário"
        description="Preencha os dados para criar um novo usuário."
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeCreateModal}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              disabled={isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Criando…
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </>
        }
      >
        <Form {...createForm}>
          <form
            id="create-user-form"
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome completo"
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="usuario@empresa.com"
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Roles
                  </FormLabel>
                  {isLoadingRoles ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                      <Loader2 className="size-3 animate-spin" />
                      Carregando roles…
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={createForm.control}
                          name="roleIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, role.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== role.id)
                                      );
                                    }
                                  }}
                                  className="rounded-[2px] border-neutral-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-neutral-300 cursor-pointer">
                                {role.name}
                                {role.isSystemRole && (
                                  <span className="ml-1.5 text-[10px] text-blue-500">
                                    (sistema)
                                  </span>
                                )}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="warehouseIds"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Armazéns
                  </FormLabel>
                  {isLoadingWarehouses ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                      <Loader2 className="size-3 animate-spin" />
                      Carregando armazéns…
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 max-h-[150px] overflow-y-auto">
                      {warehouses.map((warehouse) => (
                        <FormField
                          key={warehouse.id}
                          control={createForm.control}
                          name="warehouseIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(warehouse.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, warehouse.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== warehouse.id)
                                      );
                                    }
                                  }}
                                  className="rounded-[2px] border-neutral-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-neutral-300 cursor-pointer">
                                {warehouse.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ResponsiveModal>

      {/* Edit User Modal */}
      <ResponsiveModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) closeEditModal();
        }}
        title="Editar Usuário"
        description={selectedUser?.email || ""}
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeEditModal}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </>
        }
      >
        <Form {...editForm}>
          <form
            id="edit-user-form"
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <FormField
              control={editForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome completo"
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
                  <div>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Usuário Ativo
                    </FormLabel>
                    <p className="text-xs text-neutral-500">
                      Usuários inativos não podem acessar o sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={selectedUser?.id === currentUserId}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Roles
                  </FormLabel>
                  {isLoadingRoles ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                      <Loader2 className="size-3 animate-spin" />
                      Carregando roles…
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={editForm.control}
                          name="roleIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, role.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== role.id)
                                      );
                                    }
                                  }}
                                  className="rounded-[2px] border-neutral-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-neutral-300 cursor-pointer">
                                {role.name}
                                {role.isSystemRole && (
                                  <span className="ml-1.5 text-[10px] text-blue-500">
                                    (sistema)
                                  </span>
                                )}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="warehouseIds"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Armazéns
                  </FormLabel>
                  {isLoadingWarehouses ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                      <Loader2 className="size-3 animate-spin" />
                      Carregando armazéns…
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 max-h-[150px] overflow-y-auto">
                      {warehouses.map((warehouse) => (
                        <FormField
                          key={warehouse.id}
                          control={editForm.control}
                          name="warehouseIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(warehouse.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, warehouse.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== warehouse.id)
                                      );
                                    }
                                  }}
                                  className="rounded-[2px] border-neutral-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-neutral-300 cursor-pointer">
                                {warehouse.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ResponsiveModal>

      {/* Temporary Password Modal */}
      <ResponsiveModal
        open={!!temporaryPassword}
        onOpenChange={(open) => {
          if (!open) closePasswordModal();
        }}
        title="Usuário Criado"
        description={`Senha temporária para ${createdUserEmail}`}
        maxWidth="sm:max-w-[400px]"
        footer={
          <Button
            onClick={closePasswordModal}
            className="w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
          >
            Feito
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[4px] border border-amber-900/30 bg-amber-950/10 p-3 text-xs text-amber-500">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
              <AlertTriangle className="size-3.5" />
              Atenção
            </div>
            <p className="mt-1 opacity-90">
              Anote esta senha. Ela não será exibida novamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-[4px] border border-neutral-800 bg-neutral-900 px-3 py-2.5 font-mono text-lg tracking-wider text-white">
              {temporaryPassword}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPassword}
              className="size-10 rounded-[4px] border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            >
              {copiedPassword ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4 text-neutral-400" />
              )}
            </Button>
          </div>

          <p className="text-[10px] text-neutral-500 text-center">
            O usuário deverá trocar esta senha no primeiro login.
          </p>
        </div>
      </ResponsiveModal>
    </>
  );
};
