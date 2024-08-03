import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Inventory,
  InventoryOptionalDefaults,
  InventoryOptionalDefaultsSchema,
} from "../../../../prisma/generated/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  QueryClient,
  QueryClientContext,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../../../services/api/api";
import { ReloadIcon } from "@radix-ui/react-icons";

interface IModalCreateInventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalCreateInventory({
  isOpen,
  onClose,
}: IModalCreateInventoryProps) {
  const form = useForm<InventoryOptionalDefaults>({
    resolver: zodResolver(InventoryOptionalDefaultsSchema),
    defaultValues: {
      name: "",
    },
  });

  const queryClient = useQueryClient();

  const createInventoryMutation = useMutation({
    mutationFn: (formData: InventoryOptionalDefaults) =>
      api.inventories.create(formData),
    onSuccess: (data: Inventory) => {
      queryClient.setQueryData(["inventories"], (oldData: any) => {
        console.log(oldData, data);
        return [...oldData, data];
      });
      onClose();
    },
  });

  function onSubmit(values: InventoryOptionalDefaults) {
    createInventoryMutation.mutate(values);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar novo estoque</DialogTitle>
          <DialogDescription>
            Crie um estoque para organizar seus produtos
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do estoque</FormLabel>
                  <FormControl>
                    <Input placeholder="Estoque de São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="submit">
                {!createInventoryMutation.isPending ? (
                  "Confirmar"
                ) : (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
