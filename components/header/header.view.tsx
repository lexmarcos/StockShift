"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Package2, Warehouse, User, LogOut } from "lucide-react";
import { HeaderViewProps } from "./header.types";

export const HeaderView = ({
  pageName,
  warehouses,
  selectedWarehouseId,
  isLoadingWarehouses,
  onWarehouseChange,
  user,
  onLogout,
  onToggleMobileMenu,
}: HeaderViewProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Button (Placeholder) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileMenu}
            className="block h-10 w-10 rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-600 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
            <Package2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>

          {/* Page Name */}
          <h1 className="hidden text-base font-bold uppercase tracking-tight text-white sm:block md:text-lg">
            {pageName}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Warehouse Selector */}
          <Select
            value={selectedWarehouseId || ""}
            onValueChange={onWarehouseChange}
            disabled={isLoadingWarehouses || warehouses.length === 0}
          >
            <SelectTrigger className="h-10 w-[140px] rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-xs font-medium uppercase tracking-wide text-neutral-300 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 md:w-[180px]">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-neutral-500" />
                <SelectValue placeholder="Armazém" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-[4px] border border-neutral-800 bg-[#171717]">
              {warehouses.map((warehouse) => (
                <SelectItem
                  key={warehouse.id}
                  value={warehouse.id}
                  className="text-xs uppercase focus:bg-neutral-800"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-white">{warehouse.name}</span>
                    <span className="text-[10px] text-neutral-500">{warehouse.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[200px] rounded-[4px] border border-neutral-800 bg-[#171717]"
            >
              {/* User Info Section */}
              {user && (
                <>
                  <div className="border-b border-neutral-800 p-3">
                    <p className="text-sm font-bold text-white">{user.fullName}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                </>
              )}

              {/* Menu Items */}
              <DropdownMenuItem asChild className="text-xs uppercase tracking-wide focus:bg-neutral-800">
                <Link href="/profile" className="flex cursor-pointer items-center gap-2 text-neutral-300">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-neutral-800" />

              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-xs uppercase tracking-wide text-rose-500 focus:bg-rose-950/50 focus:text-rose-500"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
