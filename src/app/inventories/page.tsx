"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { BadgeDollarSignIcon, Boxes } from "lucide-react";
import ModalCreateInventory from "./modalCreateInventory";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../services/api/api";
import { useRouter } from "next/navigation";

export default function Inventories() {
  const [isModalCreateInventoryOpen, setIsModalCreateInventoryOpen] =
    useState(false);

  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventories"],
    queryFn: () => {
      return api.inventories.getAll();
    },
  });

  const selectInventoryMutation = useMutation({
    mutationFn: (inventoryId: string) => api.inventories.select(inventoryId),
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <ModalCreateInventory
        isOpen={isModalCreateInventoryOpen}
        onClose={() => setIsModalCreateInventoryOpen(false)}
      />
      <div className="flex justify-between">
        <h1 className="font-bold text-4xl">Estoques</h1>
        <Button onClick={() => setIsModalCreateInventoryOpen(true)}>
          Criar estoque +
        </Button>
      </div>
      <div className="grid grid-cols-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
        {data?.map((inventory) => (
          <Card
            className="p-3 w-full hover:outline-2 hover:outline hover:outline-slate-400 cursor-pointer"
            onClick={() => selectInventoryMutation.mutate(inventory.id)}
          >
            <CardContent>
              <CardTitle className="mt-2 font-bold text-xl">
                {inventory.name}
              </CardTitle>
              <div className="flex gap-3 mt-5 ">
                <Boxes /> <span>302</span>
              </div>
              <div className="flex gap-3 mt-2 ">
                <BadgeDollarSignIcon /> <span>R$ 3002,03</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
