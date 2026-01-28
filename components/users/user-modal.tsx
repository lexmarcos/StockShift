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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Info } from "lucide-react";
import { Role } from "@/app/(pages)/system/system.types";
import {
  CreateUserFormData,
  UpdateUserFormData,
} from "@/app/(pages)/system/system.schema";

interface Warehouse {
  id: string;
  name: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  createForm: UseFormReturn<CreateUserFormData>;
  updateForm: UseFormReturn<UpdateUserFormData>;
  onCreateSubmit: (data: CreateUserFormData) => void;
  onUpdateSubmit: (data: UpdateUserFormData) => void;
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
  const form = isEditMode ? updateForm : createForm;
  const onSubmit = isEditMode ? onUpdateSubmit : onCreateSubmit;

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
          onSubmit={form.handleSubmit(onSubmit as (data: CreateUserFormData | UpdateUserFormData) => void)}
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

          {/* Password - only for create */}
          {!isEditMode && (
            <FormField
              control={createForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha temporária</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Info className="h-3 w-3" />
                    <span>Usuário deverá trocar no primeiro login</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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

          {/* Warehouse */}
          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse vinculado</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (acesso global)</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
