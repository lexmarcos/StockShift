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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Shield,
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  ShieldAlert,
  Pencil,
  Trash2,
  Lock,
  Key,
  AlertTriangle,
} from "lucide-react";
import { RolesViewProps, Role } from "./roles.types";
import { cn } from "@/lib/utils";

export const RolesView = ({
  roles,
  isLoading,
  error,
  searchQuery,
  onSearchChange,
  isCreateModalOpen,
  openCreateModal,
  closeCreateModal,
  isEditModalOpen,
  selectedRole,
  openEditModal,
  closeEditModal,
  isDeleteModalOpen,
  roleToDelete,
  openDeleteModal,
  closeDeleteModal,
  confirmDelete,
  isDeleting,
  permissions,
  isLoadingPermissions,
  createForm,
  editForm,
  onCreateSubmit,
  onEditSubmit,
  isSubmitting,
  isAdmin,
  groupedPermissions,
  isLoadingAdmin
}: RolesViewProps) => {
  // Desktop actions - visible buttons
  const DesktopActions = ({ role }: { role: Role }) => (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openEditModal(role)}
        disabled={role.isSystemRole}
        title={role.isSystemRole ? "Roles de sistema não podem ser editadas" : "Editar role"}
        className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openDeleteModal(role)}
        disabled={role.isSystemRole}
        title={role.isSystemRole ? "Roles de sistema não podem ser deletadas" : "Deletar role"}
        className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500 disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Mobile actions - dropdown menu
  const MobileActions = ({ role }: { role: Role }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
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
          onClick={() => openEditModal(role)}
          disabled={role.isSystemRole}
          className={cn(
            "cursor-pointer",
            role.isSystemRole && "cursor-not-allowed opacity-50"
          )}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openDeleteModal(role)}
          disabled={role.isSystemRole}
          className={cn(
            "cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400",
            role.isSystemRole && "cursor-not-allowed opacity-50"
          )}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Deletar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const PermissionSelector = ({
    form,
    formId,
  }: {
    form: typeof createForm | typeof editForm;
    formId: string;
  }) => (
    <FormField
      control={form.control}
      name="permissionIds"
      render={() => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Permissões
          </FormLabel>
          {isLoadingPermissions ? (
            <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando permissões...
            </div>
          ) : permissions.length === 0 ? (
            <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-500">
              Nenhuma permissão disponível
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Array.from(groupedPermissions.entries()).map(([resource, resourcePermissions]) => (
                <AccordionItem
                  key={resource}
                  value={resource}
                  className="border border-neutral-800 rounded-[4px] bg-neutral-900 mb-2 last:mb-0"
                >
                  <AccordionTrigger className="px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-neutral-500" />
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
                        <FormField
                          key={permission.id}
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
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== permission.id)
                                      );
                                    }
                                  }}
                                  className="rounded-[2px] border-neutral-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal text-neutral-400 cursor-pointer">
                                <span className="text-neutral-300">{permission.actionDisplayName || permission.action}</span>
                                <span className="text-neutral-600 ml-1">({permission.scopeDisplayName || permission.scope})</span>
                                {permission.description && (
                                  <span className="block text-[10px] text-neutral-500">
                                    {permission.description}
                                  </span>
                                )}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );

  // Access denied state
  if (!isLoadingAdmin && !isAdmin) {
    return (
      <PageContainer>
        <PageHeader title="Roles" subtitle="Sistema" />
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
        <PageHeader
          title="Roles"
          subtitle="Sistema"
          actions={
            <Button
              onClick={openCreateModal}
              className="hidden h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] md:flex"
            >
              <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              NOVA ROLE
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
          <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
            <div className="text-neutral-500 absolute left-3">
              <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <Input
              placeholder="Pesquisar por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 hover:border-neutral-700"
            />
          </div>
        </div>

        <SectionLabel icon={Shield} className="mb-4">
          Lista de Roles
        </SectionLabel>

        {/* Data Display */}
        {isLoading ? (
          <LoadingState message="Carregando roles..." />
        ) : error ? (
          <ErrorState
            title="Falha na conexão"
            description="Não foi possível carregar a lista de roles."
          />
        ) : roles.length === 0 ? (
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
                ? { label: "LIMPAR BUSCA", onClick: () => onSearchChange("") }
                : { label: "NOVA ROLE", onClick: openCreateModal }
            }
          />
        ) : (
                <>
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
                        {roles.map((role) => (
                          <TableRow
                            key={role.id}
                            className="group border-b border-neutral-800/50 hover:bg-neutral-800/50"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <Shield className={cn(
                                  "h-4 w-4",
                                  role.isSystemRole ? "text-blue-500" : "text-neutral-500"
                                )} />
                                <span className="font-medium text-white">
                                  {role.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-sm text-neutral-400 max-w-[300px] truncate">
                              {role.description || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge
                                variant="outline"
                                className="rounded-[2px] border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400"
                              >
                                {role.permissions.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              {role.isSystemRole ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-[2px] border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500"
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  SISTEMA
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="rounded-[2px] border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
                                >
                                  CUSTOM
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <DesktopActions role={role} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="grid gap-3 md:hidden">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <Shield className={cn(
                                "h-4 w-4",
                                role.isSystemRole ? "text-blue-500" : "text-neutral-500"
                              )} />
                              <h3 className="font-semibold text-white">
                                {role.name}
                              </h3>
                            </div>
                            {role.description && (
                              <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
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
                                <Lock className="h-3 w-3" />
                              </Badge>
                            )}
                            <MobileActions role={role} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-neutral-600" />
                          <span className="text-xs text-neutral-500">
                            {role.permissions.length} permissões
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
      </PageContainer>

      {/* FAB Mobile */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-4 h-12 w-12 rounded-[4px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Button>

      {/* Create Role Modal */}
      <ResponsiveModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal();
        }}
        title="Nova Role"
        description="Crie uma nova role com permissões específicas."
        maxWidth="sm:max-w-[550px]"
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
              form="create-role-form"
              disabled={isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Role"
              )}
            </Button>
          </>
        }
      >
        <Form {...createForm}>
          <form
            id="create-role-form"
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
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

            <FormField
              control={createForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Descrição (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva as responsabilidades desta role..."
                      rows={2}
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <div className="max-h-[250px] overflow-y-auto">
              <PermissionSelector form={createForm} formId="create-role-form" />
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Edit Role Modal */}
      <ResponsiveModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) closeEditModal();
        }}
        title="Editar Role"
        description={selectedRole?.name || ""}
        maxWidth="sm:max-w-[550px]"
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
              form="edit-role-form"
              disabled={isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Salvando...
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
            id="edit-role-form"
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <FormField
              control={editForm.control}
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

            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    Descrição (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva as responsabilidades desta role..."
                      rows={2}
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <div className="max-h-[250px] overflow-y-auto">
              <PermissionSelector form={editForm} formId="edit-role-form" />
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Delete Confirmation Modal */}
      <ResponsiveModal
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteModal();
        }}
        title="Deletar Role"
        description={`Tem certeza que deseja deletar a role "${roleToDelete?.name}"?`}
        maxWidth="sm:max-w-[400px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeDeleteModal}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-3 py-3 text-xs text-rose-500">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" />
              Atenção
            </div>
            <p className="mt-1 opacity-90">
              Esta ação é irreversível. Usuários com esta role perderão as permissões associadas.
            </p>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
};
