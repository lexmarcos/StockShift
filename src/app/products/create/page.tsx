"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProductCreateInputObjectSchema } from "../../../../prisma/generated/schemas";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/app/services/api/api";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function InputForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof ProductCreateInputObjectSchema>>({
    resolver: zodResolver(ProductCreateInputObjectSchema),
    defaultValues: {
      name: "",
      description: "" as string,
      price: 0,
      quantity: 0,
      categories: [],
      attributes: [],
      imageUrl: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: z.infer<typeof ProductCreateInputObjectSchema>) =>
      api.products.createProduct(data),
    onSuccess: () => {
      toast({
        color: "green",
        title: "Produto criado com sucesso",
        description: "Você pode vê-lo na lista de produtos",
      });
    },
    onError: () => {
      // toast.error("Erro ao criar produto");
    },
  });

  async function onSubmit(data: z.infer<typeof ProductCreateInputObjectSchema>) {
    data.price = Number(data.price);
    data.quantity = Number(data.quantity);
    createProductMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field: { value, ...rest } }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição do produto" value={value as string} {...rest} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field: { onChange, ...rest } }) => (
            <FormItem>
              <FormLabel>Preço</FormLabel>
              <FormControl>
                <Input
                  placeholder="Preço do produto"
                  type="number"
                  {...rest}
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field: { onChange, ...rest } }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input
                  placeholder="Quantos produtos você tem?"
                  {...rest}
                  type="number"
                  onChange={(e) => onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categorias</FormLabel>
              <FormControl>
                <Input placeholder="Categorias para seu produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attributes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atributos</FormLabel>
              <FormControl>
                <Input placeholder="Atributos do seu produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field: { value, ...rest } }) => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <FormControl>
                <Input placeholder="Imagem do pruduto" {...rest} value={value as string} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {!createProductMutation.isPending ? (
            "Submit"
          ) : (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
        </Button>
      </form>
    </Form>
  );
}
