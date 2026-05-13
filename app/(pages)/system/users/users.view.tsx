"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { SectionLabel } from "@/components/ui/section-label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { User, UsersViewProps } from "./users.types";

interface UsersViewState extends UsersViewProps {
  copiedPassword: boolean;
  formatDate: (dateString: string | null) => string;
  handleCopyPassword: () => Promise<void>;
}

type CreateUserForm = UsersViewProps["createForm"];
type EditUserForm = UsersViewProps["editForm"];
type UserRoleOption = UsersViewProps["roles"][number];
type UserWarehouseOption = UsersViewProps["warehouses"][number];

const isCurrentUserRecord = (
  user: User,
  currentUserId: UsersViewProps["currentUserId"],
) => user.id === currentUserId;

const DesktopActions = ({
  currentUserId,
  openEditModal,
  toggleUserStatus,
  user,
}: {
  currentUserId: UsersViewProps["currentUserId"];
  openEditModal: (user: User) => void;
  toggleUserStatus: (user: User) => void;
  user: User;
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
      disabled={isCurrentUserRecord(user, currentUserId)}
      title={getUserStatusActionTitle(user, currentUserId)}
      className={cn(
        "size-8 rounded-[4px] disabled:opacity-30",
        user.isActive
          ? "text-neutral-500 hover:bg-amber-950/20 hover:text-amber-500"
          : "text-neutral-500 hover:bg-emerald-950/20 hover:text-emerald-500",
      )}
    >
      {user.isActive ? (
        <UserX className="size-4" />
      ) : (
        <UserCheck className="size-4" />
      )}
    </Button>
  </div>
);

const MobileActions = ({
  currentUserId,
  openEditModal,
  toggleUserStatus,
  user,
}: {
  currentUserId: UsersViewProps["currentUserId"];
  openEditModal: (user: User) => void;
  toggleUserStatus: (user: User) => void;
  user: User;
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
        disabled={isCurrentUserRecord(user, currentUserId)}
        className={cn(
          "cursor-pointer",
          isCurrentUserRecord(user, currentUserId)
            ? "cursor-not-allowed opacity-50"
            : user.isActive
              ? "text-amber-500 focus:bg-amber-950/20 focus:text-amber-400"
              : "text-emerald-500 focus:bg-emerald-950/20 focus:text-emerald-400",
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
              : "border-neutral-700 bg-neutral-800 text-neutral-400",
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

const WarehouseBadges = ({
  userWarehouses,
}: {
  userWarehouses: string[];
}) => {
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

export const UsersView = (props: UsersViewProps) => {
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopyPassword = async () => {
    if (!props.temporaryPassword) return;
    await navigator.clipboard.writeText(props.temporaryPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const viewState: UsersViewState = {
    ...props,
    copiedPassword,
    formatDate,
    handleCopyPassword,
  };

  if (!props.isLoadingAdmin && !props.isAdmin) {
    return <UsersAccessDenied />;
  }

  return (
    <>
      <UsersPage viewState={viewState} />
      <CreateUserModal viewState={viewState} />
      <EditUserModal viewState={viewState} />
      <TemporaryPasswordModal viewState={viewState} />
    </>
  );
};

function getUserStatusActionTitle(
  user: User,
  currentUserId: UsersViewProps["currentUserId"],
) {
  if (isCurrentUserRecord(user, currentUserId)) {
    return "Não é possível desativar seu próprio usuário";
  }

  return user.isActive ? "Desativar usuário" : "Ativar usuário";
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Nunca";

  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UsersAccessDenied() {
  return (
    <PageContainer>
      <UsersTitle />
      <ErrorState
        title="Acesso Negado"
        description="Você não tem permissão para acessar esta página."
      />
    </PageContainer>
  );
}

function UsersTitle() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tighter text-white">
        Usuários
      </h1>
      <p className="mt-1 text-sm text-neutral-500">Sistema</p>
    </div>
  );
}

function UsersPage({ viewState }: { viewState: UsersViewState }) {
  return (
    <PageContainer>
      <UsersHeader viewState={viewState} />
      <UsersSearch viewState={viewState} />
      <SectionLabel icon={Users} className="mb-4">
        Lista de Usuários
      </SectionLabel>
      <UsersContent viewState={viewState} />
    </PageContainer>
  );
}

function UsersHeader({ viewState }: { viewState: UsersViewState }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <UsersTitle />
      <div className="w-full md:w-auto">
        <Button
          onClick={viewState.openCreateModal}
          className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-auto"
        >
          <Plus className="mr-2 size-4" strokeWidth={2.5} />
          NOVO USUÁRIO
        </Button>
      </div>
    </div>
  );
}

function UsersSearch({ viewState }: { viewState: UsersViewState }) {
  return (
    <div className="mb-6 flex w-full flex-col gap-3 md:h-12 md:flex-row md:items-center">
      <div className="relative flex h-12 min-w-[200px] flex-1 items-center">
        <div className="absolute left-3 text-neutral-500">
          <Search className="size-3.5" strokeWidth={2.5} />
        </div>
        <Input
          placeholder="Pesquisar por nome ou email…"
          value={viewState.searchQuery}
          onChange={(event) => viewState.onSearchChange(event.target.value)}
          className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 hover:border-neutral-700 focus:border-blue-600 focus:ring-0"
        />
      </div>
    </div>
  );
}

function UsersContent({ viewState }: { viewState: UsersViewState }) {
  const { error, isLoading, searchQuery, users } = viewState;

  if (isLoading) return <LoadingState message="Carregando usuários…" />;

  if (error) {
    return (
      <ErrorState
        title="Falha na conexão"
        description="Não foi possível carregar a lista de usuários."
      />
    );
  }

  if (users.length === 0) {
    return (
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
            ? { label: "LIMPAR BUSCA", onClick: () => viewState.onSearchChange("") }
            : { label: "NOVO USUÁRIO", onClick: viewState.openCreateModal }
        }
      />
    );
  }

  return (
    <>
      <UsersTable viewState={viewState} />
      <UserMobileCards viewState={viewState} />
    </>
  );
}

function UsersTable({ viewState }: { viewState: UsersViewState }) {
  return (
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
          {viewState.users.map((user) => (
            <UserTableRow key={user.id} user={user} viewState={viewState} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserTableRow({
  user,
  viewState,
}: {
  user: User;
  viewState: UsersViewState;
}) {
  return (
    <TableRow
      className={cn(
        "group border-b border-neutral-800/50 hover:bg-neutral-800/50",
        !user.isActive && "opacity-50",
      )}
    >
      <TableCell className="py-3">
        <UserIdentity user={user} viewState={viewState} />
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
        <UserLastLogin user={user} viewState={viewState} />
      </TableCell>
      <TableCell className="py-3 text-right">
        <DesktopActions
          user={user}
          currentUserId={viewState.currentUserId}
          openEditModal={viewState.openEditModal}
          toggleUserStatus={viewState.toggleUserStatus}
        />
      </TableCell>
    </TableRow>
  );
}

function UserIdentity({
  user,
  viewState,
}: {
  user: User;
  viewState: UsersViewState;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-white">
        {user.fullName}
        {isCurrentUserRecord(user, viewState.currentUserId) && (
          <span className="ml-2 text-[10px] text-blue-500">(você)</span>
        )}
      </span>
      <span className="text-xs text-neutral-500">{user.email}</span>
    </div>
  );
}

function UserLastLogin({
  user,
  viewState,
}: {
  user: User;
  viewState: UsersViewState;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
      <Clock className="size-3" />
      {viewState.formatDate(user.lastLogin)}
    </div>
  );
}

function UserMobileCards({ viewState }: { viewState: UsersViewState }) {
  return (
    <div className="grid gap-3 md:hidden">
      {viewState.users.map((user) => (
        <UserMobileCard key={user.id} user={user} viewState={viewState} />
      ))}
    </div>
  );
}

function UserMobileCard({
  user,
  viewState,
}: {
  user: User;
  viewState: UsersViewState;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700",
        !user.isActive && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between">
        <UserIdentity user={user} viewState={viewState} />
        <div className="flex items-center gap-2">
          <StatusBadge user={user} />
          <MobileActions
            user={user}
            currentUserId={viewState.currentUserId}
            openEditModal={viewState.openEditModal}
            toggleUserStatus={viewState.toggleUserStatus}
          />
        </div>
      </div>
      <UserMobileRoleLine user={user} />
      <UserMobileWarehouseLine user={user} />
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
        <Clock className="size-3" />
        Último login: {viewState.formatDate(user.lastLogin)}
      </div>
    </div>
  );
}

function UserMobileRoleLine({ user }: { user: User }) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5">
        <Shield className="size-3 text-neutral-600" />
        <RoleBadges userRoles={user.roles} />
      </div>
    </div>
  );
}

function UserMobileWarehouseLine({ user }: { user: User }) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5">
        <Warehouse className="size-3 text-neutral-600" />
        <WarehouseBadges userWarehouses={user.warehouses} />
      </div>
    </div>
  );
}

function CreateUserModal({ viewState }: { viewState: UsersViewState }) {
  const { closeCreateModal, createForm, isCreateModalOpen, onCreateSubmit } =
    viewState;

  return (
    <ResponsiveModal
      open={isCreateModalOpen}
      onOpenChange={(open) => {
        if (!open) closeCreateModal();
      }}
      title="Novo Usuário"
      description="Preencha os dados para criar um novo usuário."
      maxWidth="sm:max-w-[500px]"
      footer={
        <UserFormFooter
          formId="create-user-form"
          isSubmitting={viewState.isSubmitting}
          onClose={closeCreateModal}
          submitLabel="Criar Usuário"
          submittingLabel="Criando…"
        />
      }
    >
      <Form {...createForm}>
        <form
          id="create-user-form"
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="space-y-4"
        >
          <CreateUserFullNameField form={createForm} />
          <CreateUserEmailField form={createForm} />
          <CreateUserRolesField viewState={viewState} />
          <CreateUserWarehousesField viewState={viewState} />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function EditUserModal({ viewState }: { viewState: UsersViewState }) {
  const { closeEditModal, editForm, isEditModalOpen, onEditSubmit, selectedUser } =
    viewState;

  return (
    <ResponsiveModal
      open={isEditModalOpen}
      onOpenChange={(open) => {
        if (!open) closeEditModal();
      }}
      title="Editar Usuário"
      description={selectedUser?.email || ""}
      maxWidth="sm:max-w-[500px]"
      footer={
        <UserFormFooter
          formId="edit-user-form"
          isSubmitting={viewState.isSubmitting}
          onClose={closeEditModal}
          submitLabel="Salvar Alterações"
          submittingLabel="Salvando…"
        />
      }
    >
      <Form {...editForm}>
        <form
          id="edit-user-form"
          onSubmit={editForm.handleSubmit(onEditSubmit)}
          className="space-y-4"
        >
          <EditUserFullNameField form={editForm} />
          <EditUserActiveField viewState={viewState} />
          <EditUserRolesField viewState={viewState} />
          <EditUserWarehousesField viewState={viewState} />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function UserFormFooter({
  formId,
  isSubmitting,
  onClose,
  submitLabel,
  submittingLabel,
}: {
  formId: string;
  isSubmitting: boolean;
  onClose: () => void;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
        className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form={formId}
        disabled={isSubmitting}
        className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </>
  );
}

function CreateUserFullNameField({ form }: { form: CreateUserForm }) {
  return (
    <FormField
      control={form.control}
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
  );
}

function EditUserFullNameField({ form }: { form: EditUserForm }) {
  return (
    <FormField
      control={form.control}
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
  );
}

function CreateUserEmailField({ form }: { form: CreateUserForm }) {
  return (
    <FormField
      control={form.control}
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
  );
}

function EditUserActiveField({ viewState }: { viewState: UsersViewState }) {
  return (
    <FormField
      control={viewState.editForm.control}
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
              disabled={viewState.selectedUser?.id === viewState.currentUserId}
              className="data-[state=checked]:bg-blue-600"
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function CreateUserRolesField({ viewState }: { viewState: UsersViewState }) {
  return (
    <FormField
      control={viewState.createForm.control}
      name="roleIds"
      render={() => (
        <UserAssignmentField label="Roles" isLoading={viewState.isLoadingRoles}>
          <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            {viewState.roles.map((role) => (
              <CreateUserRoleCheckbox
                key={role.id}
                form={viewState.createForm}
                role={role}
              />
            ))}
          </div>
        </UserAssignmentField>
      )}
    />
  );
}

function EditUserRolesField({ viewState }: { viewState: UsersViewState }) {
  return (
    <FormField
      control={viewState.editForm.control}
      name="roleIds"
      render={() => (
        <UserAssignmentField label="Roles" isLoading={viewState.isLoadingRoles}>
          <div className="space-y-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            {viewState.roles.map((role) => (
              <EditUserRoleCheckbox
                key={role.id}
                form={viewState.editForm}
                role={role}
              />
            ))}
          </div>
        </UserAssignmentField>
      )}
    />
  );
}

function CreateUserWarehousesField({
  viewState,
}: {
  viewState: UsersViewState;
}) {
  return (
    <FormField
      control={viewState.createForm.control}
      name="warehouseIds"
      render={() => (
        <UserAssignmentField
          label="Armazéns"
          isLoading={viewState.isLoadingWarehouses}
        >
          <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            {viewState.warehouses.map((warehouse) => (
              <CreateUserWarehouseCheckbox
                key={warehouse.id}
                form={viewState.createForm}
                warehouse={warehouse}
              />
            ))}
          </div>
        </UserAssignmentField>
      )}
    />
  );
}

function EditUserWarehousesField({ viewState }: { viewState: UsersViewState }) {
  return (
    <FormField
      control={viewState.editForm.control}
      name="warehouseIds"
      render={() => (
        <UserAssignmentField
          label="Armazéns"
          isLoading={viewState.isLoadingWarehouses}
        >
          <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            {viewState.warehouses.map((warehouse) => (
              <EditUserWarehouseCheckbox
                key={warehouse.id}
                form={viewState.editForm}
                warehouse={warehouse}
              />
            ))}
          </div>
        </UserAssignmentField>
      )}
    />
  );
}

function UserAssignmentField({
  children,
  isLoading,
  label,
}: {
  children: ReactNode;
  isLoading: boolean;
  label: string;
}) {
  return (
    <FormItem>
      <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
        {label}
      </FormLabel>
      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
          <Loader2 className="size-3 animate-spin" />
          Carregando {label.toLowerCase()}…
        </div>
      ) : (
        children
      )}
      <FormMessage className="text-xs text-rose-500" />
    </FormItem>
  );
}

function CreateUserRoleCheckbox({
  form,
  role,
}: {
  form: CreateUserForm;
  role: UserRoleOption;
}) {
  return (
    <FormField
      control={form.control}
      name="roleIds"
      render={({ field }) => (
        <UserRoleCheckboxItem field={field} role={role} />
      )}
    />
  );
}

function EditUserRoleCheckbox({
  form,
  role,
}: {
  form: EditUserForm;
  role: UserRoleOption;
}) {
  return (
    <FormField
      control={form.control}
      name="roleIds"
      render={({ field }) => <UserRoleCheckboxItem field={field} role={role} />}
    />
  );
}

function UserRoleCheckboxItem({
  field,
  role,
}: {
  field: { value?: string[]; onChange: (value: string[]) => void };
  role: UserRoleOption;
}) {
  return (
    <FormItem className="flex items-center gap-2">
      <FormControl>
        <Checkbox
          checked={field.value?.includes(role.id)}
          onCheckedChange={(checked) => {
            const current = field.value || [];
            if (checked) {
              field.onChange([...current, role.id]);
              return;
            }
            field.onChange(current.filter((id) => id !== role.id));
          }}
          className="rounded-[2px] border-neutral-700 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
        />
      </FormControl>
      <FormLabel className="cursor-pointer text-sm font-normal text-neutral-300">
        {role.name}
        {role.isSystemRole && (
          <span className="ml-1.5 text-[10px] text-blue-500">(sistema)</span>
        )}
      </FormLabel>
    </FormItem>
  );
}

function CreateUserWarehouseCheckbox({
  form,
  warehouse,
}: {
  form: CreateUserForm;
  warehouse: UserWarehouseOption;
}) {
  return (
    <FormField
      control={form.control}
      name="warehouseIds"
      render={({ field }) => (
        <UserWarehouseCheckboxItem field={field} warehouse={warehouse} />
      )}
    />
  );
}

function EditUserWarehouseCheckbox({
  form,
  warehouse,
}: {
  form: EditUserForm;
  warehouse: UserWarehouseOption;
}) {
  return (
    <FormField
      control={form.control}
      name="warehouseIds"
      render={({ field }) => (
        <UserWarehouseCheckboxItem field={field} warehouse={warehouse} />
      )}
    />
  );
}

function UserWarehouseCheckboxItem({
  field,
  warehouse,
}: {
  field: { value?: string[]; onChange: (value: string[]) => void };
  warehouse: UserWarehouseOption;
}) {
  return (
    <FormItem className="flex items-center gap-2">
      <FormControl>
        <Checkbox
          checked={field.value?.includes(warehouse.id)}
          onCheckedChange={(checked) => {
            const current = field.value || [];
            if (checked) {
              field.onChange([...current, warehouse.id]);
              return;
            }
            field.onChange(current.filter((id) => id !== warehouse.id));
          }}
          className="rounded-[2px] border-neutral-700 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
        />
      </FormControl>
      <FormLabel className="cursor-pointer text-sm font-normal text-neutral-300">
        {warehouse.name}
      </FormLabel>
    </FormItem>
  );
}

function TemporaryPasswordModal({
  viewState,
}: {
  viewState: UsersViewState;
}) {
  return (
    <ResponsiveModal
      open={!!viewState.temporaryPassword}
      onOpenChange={(open) => {
        if (!open) viewState.closePasswordModal();
      }}
      title="Usuário Criado"
      description={`Senha temporária para ${viewState.createdUserEmail}`}
      maxWidth="sm:max-w-[400px]"
      footer={
        <Button
          onClick={viewState.closePasswordModal}
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
        <TemporaryPasswordValue viewState={viewState} />
        <p className="text-center text-[10px] text-neutral-500">
          O usuário deverá trocar esta senha no primeiro login.
        </p>
      </div>
    </ResponsiveModal>
  );
}

function TemporaryPasswordValue({
  viewState,
}: {
  viewState: UsersViewState;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-[4px] border border-neutral-800 bg-neutral-900 px-3 py-2.5 font-mono text-lg tracking-wider text-white">
        {viewState.temporaryPassword}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={viewState.handleCopyPassword}
        className="size-10 rounded-[4px] border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
      >
        {viewState.copiedPassword ? (
          <Check className="size-4 text-emerald-500" />
        ) : (
          <Copy className="size-4 text-neutral-400" />
        )}
      </Button>
    </div>
  );
}
