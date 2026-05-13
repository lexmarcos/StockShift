"use client";

import {
  AlertTriangle,
  Eye,
  Key,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RolePermissionsModal } from "./roles-permissions-modal.view";
import type { Role, RolesViewProps } from "./roles.types";

type RoleForm = RolesViewProps["createForm"] | RolesViewProps["editForm"];
type RolePermission = RolesViewProps["permissions"][number];
type GroupedRolePermissions = RolesViewProps["groupedPermissions"];
type RolesViewState = RolesViewProps;

const DesktopActions = ({
  openDeleteModal,
  openEditModal,
  openPermissionsModal,
  role,
}: {
  openDeleteModal: (role: Role) => void;
  openEditModal: (role: Role) => void;
  openPermissionsModal: (role: Role) => void;
  role: Role;
}) => (
  <div className="flex justify-end gap-1">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openPermissionsModal(role)}
      title="Ver permissões da role"
      aria-label={`Ver permissões da role ${role.name}`}
      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
    >
      <Eye className="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openEditModal(role)}
      disabled={role.isSystemRole}
      title={
        role.isSystemRole ? "Roles de sistema não podem ser editadas" : "Editar role"
      }
      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
    >
      <Pencil className="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openDeleteModal(role)}
      disabled={role.isSystemRole}
      title={
        role.isSystemRole ? "Roles de sistema não podem ser deletadas" : "Deletar role"
      }
      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500 disabled:opacity-30"
    >
      <Trash2 className="size-4" />
    </Button>
  </div>
);

const MobileActions = ({
  openDeleteModal,
  openEditModal,
  openPermissionsModal,
  role,
}: {
  openDeleteModal: (role: Role) => void;
  openEditModal: (role: Role) => void;
  openPermissionsModal: (role: Role) => void;
  role: Role;
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
        Ações da Role
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-neutral-800" />
      <DropdownMenuItem
        onClick={() => openPermissionsModal(role)}
        className="cursor-pointer"
      >
        <Eye className="mr-2 size-3.5" />
        Ver permissões
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => openEditModal(role)}
        disabled={role.isSystemRole}
        className={cn(
          "cursor-pointer",
          role.isSystemRole && "cursor-not-allowed opacity-50",
        )}
      >
        <Pencil className="mr-2 size-3.5" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => openDeleteModal(role)}
        disabled={role.isSystemRole}
        className={cn(
          "cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400",
          role.isSystemRole && "cursor-not-allowed opacity-50",
        )}
      >
        <Trash2 className="mr-2 size-3.5" />
        Deletar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const PermissionSelector = ({
  form,
  groupedPermissions,
  isLoadingPermissions,
  permissions,
}: {
  form: RoleForm;
  groupedPermissions: GroupedRolePermissions;
  isLoadingPermissions: boolean;
  permissions: RolePermission[];
}) => (
  <FormField
    control={form.control}
    name="permissionIds"
    render={() => (
      <FormItem>
        <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
          Permissões
        </FormLabel>
        <RolePermissionSelectorContent
          form={form}
          groupedPermissions={groupedPermissions}
          isLoadingPermissions={isLoadingPermissions}
          permissions={permissions}
        />
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

export const RolesView = (props: RolesViewProps) => {
  const viewState: RolesViewState = props;

  if (!props.isLoadingAdmin && !props.isAdmin) {
    return <RolesAccessDenied />;
  }

  return (
    <>
      <RolesPage viewState={viewState} />
      <RolePermissionsModal
        open={props.isPermissionsModalOpen}
        role={props.roleToViewPermissions}
        groupedPermissions={props.viewedRoleGroupedPermissions}
        onClose={props.closePermissionsModal}
      />
      <RoleCreateModal viewState={viewState} />
      <RoleEditModal viewState={viewState} />
      <RoleDeleteModal viewState={viewState} />
    </>
  );
};

function RolesAccessDenied() {
  return (
    <PageContainer>
      <RolesTitle />
      <ErrorState
        title="Acesso Negado"
        description="Você não tem permissão para acessar esta página."
      />
    </PageContainer>
  );
}

function RolesTitle() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tighter text-white">
        Roles
      </h1>
      <p className="mt-1 text-sm text-neutral-500">Sistema</p>
    </div>
  );
}

function RolesPage({ viewState }: { viewState: RolesViewState }) {
  return (
    <PageContainer>
      <RolesHeader viewState={viewState} />
      <RolesSearch viewState={viewState} />
      <SectionLabel icon={Shield} className="mb-4">
        Lista de Roles
      </SectionLabel>
      <RolesContent viewState={viewState} />
    </PageContainer>
  );
}

function RolesHeader({ viewState }: { viewState: RolesViewState }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <RolesTitle />
      <div className="w-full md:w-auto">
        <Button
          onClick={viewState.openCreateModal}
          className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-auto"
        >
          <Plus className="mr-2 size-4" strokeWidth={2.5} />
          NOVA ROLE
        </Button>
      </div>
    </div>
  );
}

function RolesSearch({ viewState }: { viewState: RolesViewState }) {
  return (
    <div className="mb-6 flex w-full flex-col gap-3 md:h-12 md:flex-row md:items-center">
      <div className="relative flex h-12 min-w-[200px] flex-1 items-center">
        <div className="absolute left-3 text-neutral-500">
          <Search className="size-3.5" strokeWidth={2.5} />
        </div>
        <Input
          placeholder="Pesquisar por nome ou descrição…"
          value={viewState.searchQuery}
          onChange={(event) => viewState.onSearchChange(event.target.value)}
          className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 hover:border-neutral-700 focus:border-blue-600 focus:ring-0"
        />
      </div>
    </div>
  );
}

function RolesContent({ viewState }: { viewState: RolesViewState }) {
  const { error, isLoading, roles, searchQuery } = viewState;

  if (isLoading) return <LoadingState message="Carregando roles…" />;

  if (error) {
    return (
      <ErrorState
        title="Falha na conexão"
        description="Não foi possível carregar a lista de roles."
      />
    );
  }

  if (roles.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title={searchQuery ? "Nenhum resultado encontrado" : "Nenhuma role cadastrada"}
        description={
          searchQuery
            ? "Tente ajustar seus termos de busca."
            : "Comece adicionando roles ao sistema."
        }
        action={
          searchQuery
            ? { label: "LIMPAR BUSCA", onClick: () => viewState.onSearchChange("") }
            : { label: "NOVA ROLE", onClick: viewState.openCreateModal }
        }
      />
    );
  }

  return (
    <>
      <RolesTable viewState={viewState} />
      <RoleMobileCards viewState={viewState} />
    </>
  );
}

function RolesTable({ viewState }: { viewState: RolesViewState }) {
  return (
    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
      <Table>
        <TableHeader className="bg-neutral-900">
          <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Nome
            </TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Descrição
            </TableHead>
            <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Permissões
            </TableHead>
            <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Tipo
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viewState.roles.map((role) => (
            <RoleTableRow key={role.id} role={role} viewState={viewState} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoleTableRow({
  role,
  viewState,
}: {
  role: Role;
  viewState: RolesViewState;
}) {
  return (
    <TableRow className="group border-b border-neutral-800/50 hover:bg-neutral-800/50">
      <TableCell className="py-3">
        <RoleName role={role} />
      </TableCell>
      <TableCell className="max-w-[300px] truncate py-3 text-sm text-neutral-400">
        {role.description || "—"}
      </TableCell>
      <TableCell className="py-3 text-center">
        <RolePermissionCountButton role={role} viewState={viewState} />
      </TableCell>
      <TableCell className="py-3 text-center">
        <RoleTypeBadge role={role} />
      </TableCell>
      <TableCell className="py-3 text-right">
        <DesktopActions
          role={role}
          openPermissionsModal={viewState.openPermissionsModal}
          openEditModal={viewState.openEditModal}
          openDeleteModal={viewState.openDeleteModal}
        />
      </TableCell>
    </TableRow>
  );
}

function RoleName({ role }: { role: Role }) {
  return (
    <div className="flex items-center gap-2">
      <Shield
        className={cn(
          "size-4",
          role.isSystemRole ? "text-blue-500" : "text-neutral-500",
        )}
      />
      <span className="font-medium text-white">{role.name}</span>
    </div>
  );
}

function RolePermissionCountButton({
  role,
  viewState,
}: {
  role: Role;
  viewState: RolesViewState;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => viewState.openPermissionsModal(role)}
      className="h-7 rounded-[4px] px-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
      title="Ver permissões da role"
    >
      <Key className="mr-1.5 size-3" />
      <span className="text-[10px] font-bold">{role.permissions.length}</span>
    </Button>
  );
}

function RoleTypeBadge({ role }: { role: Role }) {
  if (role.isSystemRole) {
    return (
      <Badge
        variant="outline"
        className="rounded-[2px] border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500"
      >
        <Lock className="mr-1 size-3" />
        SISTEMA
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-[2px] border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
    >
      CUSTOM
    </Badge>
  );
}

function RoleMobileCards({ viewState }: { viewState: RolesViewState }) {
  return (
    <div className="grid gap-3 md:hidden">
      {viewState.roles.map((role) => (
        <RoleMobileCard key={role.id} role={role} viewState={viewState} />
      ))}
    </div>
  );
}

function RoleMobileCard({
  role,
  viewState,
}: {
  role: Role;
  viewState: RolesViewState;
}) {
  return (
    <div className="relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <RoleName role={role} />
          {role.description && (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
              {role.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {role.isSystemRole && (
            <Badge
              variant="outline"
              className="rounded-[2px] border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500"
            >
              <Lock className="size-3" />
            </Badge>
          )}
          <MobileActions
            role={role}
            openPermissionsModal={viewState.openPermissionsModal}
            openEditModal={viewState.openEditModal}
            openDeleteModal={viewState.openDeleteModal}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Key className="size-3 text-neutral-600" />
        <button
          type="button"
          onClick={() => viewState.openPermissionsModal(role)}
          className="rounded-[4px] text-left text-xs text-neutral-500 hover:text-white"
        >
          {role.permissions.length} permissões
        </button>
      </div>
    </div>
  );
}

function RolePermissionSelectorContent({
  form,
  groupedPermissions,
  isLoadingPermissions,
  permissions,
}: {
  form: RoleForm;
  groupedPermissions: GroupedRolePermissions;
  isLoadingPermissions: boolean;
  permissions: RolePermission[];
}) {
  if (isLoadingPermissions) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
        <Loader2 className="size-3 animate-spin" />
        Carregando permissões…
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-500">
        Nenhuma permissão disponível
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {Array.from(groupedPermissions.entries()).map(
        ([resource, resourcePermissions]) => (
          <PermissionResourceGroup
            key={resource}
            form={form}
            resource={resource}
            resourcePermissions={resourcePermissions}
          />
        ),
      )}
    </Accordion>
  );
}

function PermissionResourceGroup({
  form,
  resource,
  resourcePermissions,
}: {
  form: RoleForm;
  resource: string;
  resourcePermissions: RolePermission[];
}) {
  return (
    <AccordionItem
      value={resource}
      className="mb-2 rounded-[4px] border border-neutral-800 bg-neutral-900 last:mb-0"
    >
      <AccordionTrigger className="px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:no-underline">
        <div className="flex items-center gap-2">
          <Key className="size-3.5 text-neutral-500" />
          {resource}
          <Badge
            variant="outline"
            className="rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 py-0 text-[10px] font-bold text-neutral-500"
          >
            {resourcePermissions.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="space-y-2">
          {resourcePermissions.map((permission) => (
            <PermissionCheckbox
              key={permission.id}
              form={form}
              permission={permission}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function PermissionCheckbox({
  form,
  permission,
}: {
  form: RoleForm;
  permission: RolePermission;
}) {
  return (
    <FormField
      control={form.control}
      name="permissionIds"
      render={({ field }) => (
        <FormItem className="flex items-center gap-2">
          <FormControl>
            <Checkbox
              checked={field.value?.includes(permission.id)}
              onCheckedChange={(checked) => {
                const current = field.value || [];
                if (checked) {
                  field.onChange([...current, permission.id]);
                  return;
                }
                field.onChange(current.filter((id) => id !== permission.id));
              }}
              className="rounded-[2px] border-neutral-700 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            />
          </FormControl>
          <FormLabel className="cursor-pointer text-xs font-normal text-neutral-400">
            <span className="text-neutral-300">
              {permission.actionDisplayName || permission.action}
            </span>
            <span className="ml-1 text-neutral-600">
              ({permission.scopeDisplayName || permission.scope})
            </span>
            {permission.description && (
              <span className="block text-[10px] text-neutral-500">
                {permission.description}
              </span>
            )}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

function RoleCreateModal({ viewState }: { viewState: RolesViewState }) {
  return (
    <RoleFormModal
      form={viewState.createForm}
      formId="create-role-form"
      title="Nova Role"
      description="Crie uma nova role com permissões específicas."
      isOpen={viewState.isCreateModalOpen}
      onClose={viewState.closeCreateModal}
      onSubmit={viewState.onCreateSubmit}
      submitLabel="Criar Role"
      submittingLabel="Criando…"
      viewState={viewState}
    />
  );
}

function RoleEditModal({ viewState }: { viewState: RolesViewState }) {
  return (
    <RoleFormModal
      form={viewState.editForm}
      formId="edit-role-form"
      title="Editar Role"
      description={viewState.selectedRole?.name || ""}
      isOpen={viewState.isEditModalOpen}
      onClose={viewState.closeEditModal}
      onSubmit={viewState.onEditSubmit}
      submitLabel="Salvar Alterações"
      submittingLabel="Salvando…"
      viewState={viewState}
    />
  );
}

function RoleFormModal({
  description,
  form,
  formId,
  isOpen,
  onClose,
  onSubmit,
  submitLabel,
  submittingLabel,
  title,
  viewState,
}: {
  description: string;
  form: RoleForm;
  formId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: RolesViewProps["onCreateSubmit"] | RolesViewProps["onEditSubmit"];
  submitLabel: string;
  submittingLabel: string;
  title: string;
  viewState: RolesViewState;
}) {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      description={description}
      maxWidth="sm:max-w-[550px]"
      footer={
        <RoleFormFooter
          formId={formId}
          isSubmitting={viewState.isSubmitting}
          onClose={onClose}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
        />
      }
    >
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <RoleNameField form={form} />
          <RoleDescriptionField form={form} />
          <div className="max-h-[250px] overflow-y-auto">
            <PermissionSelector
              form={form}
              isLoadingPermissions={viewState.isLoadingPermissions}
              permissions={viewState.permissions}
              groupedPermissions={viewState.groupedPermissions}
            />
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function RoleFormFooter({
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

function RoleNameField({ form }: { form: RoleForm }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Nome
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Ex: Gerente de Estoque"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function RoleDescriptionField({ form }: { form: RoleForm }) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Descrição (opcional)
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Descreva as responsabilidades desta role…"
              rows={2}
              className="resize-none rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function RoleDeleteModal({ viewState }: { viewState: RolesViewState }) {
  return (
    <ResponsiveModal
      open={viewState.isDeleteModalOpen}
      onOpenChange={(open) => {
        if (!open) viewState.closeDeleteModal();
      }}
      title="Deletar Role"
      description={`Tem certeza que deseja deletar a role "${viewState.roleToDelete?.name}"?`}
      maxWidth="sm:max-w-[400px]"
      footer={<RoleDeleteFooter viewState={viewState} />}
    >
      <div className="space-y-4">
        <div className="rounded-[4px] border border-rose-900/30 bg-rose-950/10 p-3 text-xs text-rose-500">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
            <AlertTriangle className="size-3.5" />
            Atenção
          </div>
          <p className="mt-1 opacity-90">
            Esta ação é irreversível. Usuários com esta role perderão as
            permissões associadas.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function RoleDeleteFooter({ viewState }: { viewState: RolesViewState }) {
  return (
    <>
      <Button
        variant="ghost"
        onClick={viewState.closeDeleteModal}
        className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
      >
        Cancelar
      </Button>
      <Button
        onClick={viewState.confirmDelete}
        disabled={viewState.isDeleting}
        className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
      >
        {viewState.isDeleting ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Deletando…
          </>
        ) : (
          "Deletar"
        )}
      </Button>
    </>
  );
}
