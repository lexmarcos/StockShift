"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";
import styles from "./addByCode.module.css";
import { Info } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Drawer } from "@/components/ui/drawer";
import { DrawerOfProduct } from "./drawerOfProduct";
export default function AddByCode() {
  const [text, setText] = useState("");

  const formatsAccepted: BarcodeFormat[] = [
    "aztec",
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "databar",
    "databar_expanded",
    "data_matrix",
    "dx_film_edge",
    "ean_13",
    "ean_8",
    "itf",
    "maxi_code",
    "micro_qr_code",
    "pdf417",
    "qr_code",
    "rm_qr_code",
    "upc_a",
    "upc_e",
    "linear_codes",
    "matrix_codes",
  ];

  const [isFindDrawerOpen, setIsFindDrawerOpen] = useState(false);

  return (
    <>
      <div className="w-full flex justify-center relative">
        <Scanner
          key={text}
          formats={formatsAccepted}
          onScan={(result) => {
            setText(result[0].rawValue);
            setIsFindDrawerOpen(true);
          }}
          classNames={{ video: styles.video, container: styles.container }}
          components={{ finder: false }}
        />
        <div className={styles.value}>
          {text ? (
            <h1 className="mb-4 text-xl font-bold">{text}</h1>
          ) : (
            <div className="mb-4 text-xs text-zinc-300 flex items-center gap-1">
              <span>
                <Info size={12} />
              </span>
              <span>aponte a câmera para um código de barras</span>
            </div>
          )}
        </div>
      </div>
      <DrawerOfProduct
        isOpen={isFindDrawerOpen}
        onClose={() => {
          setIsFindDrawerOpen(false);
          setText("");
        }}
        sku={text}
      />
    </>
  );
}
