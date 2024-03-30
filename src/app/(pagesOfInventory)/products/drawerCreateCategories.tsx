import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import {
  CategoryOptionalDefaults,
  CategoryOptionalDefaultsSchema,
} from "../../../../prisma/generated/zod";

interface IDrawerCategoriesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawerCreateCategories({
  isOpen,
  onClose,
}: IDrawerCategoriesProps) {
  const form = useForm<CategoryOptionalDefaults>({
    resolver: zodResolver(CategoryOptionalDefaultsSchema),
    defaultValues: {
      name: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryOptionalDefaults) => api.categories.create(data),
    onSuccess: () => {
      form.clearErrors();
    },
  });

  function onSubmit(data: CategoryOptionalDefaults) {
    createCategoryMutation.mutate(data);
  }

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Crie uma nova categoria</DrawerTitle>
            <DrawerDescription>
              Categorias servem para você agrupar tipos de produtos
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da categoria</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DrawerFooter>
                  <Button type="submit">Criar Categoria</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
