"use client";

import { UseFormReturn } from "react-hook-form";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Info } from "lucide-react";
import { Role } from "@/app/(pages)/system/roles/roles.types";
import {
  CreateUserFormData,
  EditUserFormData,
} from "@/app/(pages)/system/users/users.schema";

interface Warehouse {
  id: string;
  name: string;
}

interface UserCommonFormData {
  fullName: string;
  roleIds: string[];
  warehouseIds: string[];
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  createForm: UseFormReturn<CreateUserFormData>;
  updateForm: UseFormReturn<EditUserFormData>;
  onCreateSubmit: (data: CreateUserFormData) => void;
  onUpdateSubmit: (data: EditUserFormData) => void;
  roles: Role[];
  warehouses: Warehouse[];
  isSubmitting: boolean;
  isRolesLoading: boolean;
}

export const UserModal = ({
  isOpen,
  onClose,
  isEditMode,
  createForm,
  updateForm,
  onCreateSubmit,
  onUpdateSubmit,
  roles,
  warehouses,
  isSubmitting,
  isRolesLoading,
}: UserModalProps) => {
  const form = (isEditMode ? updateForm : createForm) as unknown as UseFormReturn<UserCommonFormData>;
  const handleSubmit = isEditMode
    ? updateForm.handleSubmit(onUpdateSubmit)
    : createForm.handleSubmit(onCreateSubmit);

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={isEditMode ? "Editar Usuário" : "Novo Usuário"}
      description={
        isEditMode
          ? "Atualize as informações do usuário"
          : "Preencha os dados para criar um novo usuário"
      }
    >
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="João Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email - only for create */}
          {!isEditMode && (
            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@empresa.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!isEditMode && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>O backend gera uma senha temporária no cadastro.</span>
            </div>
          )}

          {/* Roles */}
          <FormField
            control={form.control}
            name="roleIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roles</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {isRolesLoading ? (
                    <div className="col-span-2 text-sm text-muted-foreground">
                      Carregando roles...
                    </div>
                  ) : (
                    roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:bg-foreground/5 cursor-pointer"
                      >
                        <Checkbox
                          checked={field.value?.includes(role.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, role.id]);
                            } else {
                              field.onChange(
                                current.filter((id: string) => id !== role.id)
                              );
                            }
                          }}
                        />
                        <div>
                          <span className="text-sm font-medium">{role.name}</span>
                          {role.description && (
                            <p className="text-xs text-muted-foreground">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Warehouses */}
          <FormField
            control={form.control}
            name="warehouseIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouses vinculados</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {warehouses.map((warehouse) => (
                    <label
                      key={warehouse.id}
                      className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:bg-foreground/5 cursor-pointer"
                    >
                      <Checkbox
                        checked={field.value?.includes(warehouse.id)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, warehouse.id]);
                            return;
                          }
                          field.onChange(
                            current.filter((id: string) => id !== warehouse.id),
                          );
                        }}
                      />
                      <span className="text-sm font-medium">
                        {warehouse.name}
                      </span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active status - only for edit */}
          {isEditMode && (
            <FormField
              control={updateForm.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border/50 p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Usuário ativo
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Usuários inativos não podem acessar o sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar" : "Criar usuário"}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
