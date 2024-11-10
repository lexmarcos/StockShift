import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

interface IFooterDrawerNewOptions {
  trigger: ReactElement;
}

export function FooterDrawerNewOptions({ trigger }: IFooterDrawerNewOptions) {
  const router = useRouter();

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>O que você quer adicionar?</DrawerTitle>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerTrigger asChild>
            <Button onClick={() => router.push("/products/create")}>
              Novo produto
            </Button>
          </DrawerTrigger>
          <DrawerTrigger asChild>
            <Button onClick={() => router.push("/")}>Nova venda</Button>
          </DrawerTrigger>
          <DrawerClose>
            <Button className="w-full" variant="outline">
              Fechar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
