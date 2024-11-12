"use client";
import { useState } from "react";
import { DrawerOfProduct } from "./drawerOfProduct";
import ScannerBarCode from "./ScannerBarCode";

export const scannerFormats: BarcodeFormat[] = [
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

export default function AddByCode() {
  const [text, setText] = useState("");
  const [isFindDrawerOpen, setIsFindDrawerOpen] = useState(false);

  return (
    <>
      <div className="w-full flex justify-center relative">
        <ScannerBarCode
          key={text}
          value={text}
          formats={scannerFormats}
          onScan={(result) => {
            setText(result[0].rawValue);
            setIsFindDrawerOpen(true);
          }}
        />
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
