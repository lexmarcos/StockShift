"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, Building2, CreditCard } from "lucide-react";
import { CompanyLogoUpload } from "./company-logo-upload";
import { CompanyViewProps } from "./company.types";

const companySchema = z.object({
  businessName: z.string().min(1, "Nome da empresa é obrigatório"),
  document: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

const infinitePaySchema = z.object({
  handle: z.string().optional(),
  docNumber: z.string().min(1, "Número do documento é obrigatório"),
});

export const CompanyView = ({
  companyConfig,
  infinitePayConfig,
  isLoadingCompany,
  isLoadingInfinitePay,
  isUpdatingCompany,
  isUpdatingInfinitePay,
  isEditingInfinitePay,
  error,
  onUpdateCompany,
  onUpdateInfinitePay,
  onEditInfinitePay,
}: CompanyViewProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      businessName: companyConfig?.businessName || "",
      document: companyConfig?.document || "",
      email: companyConfig?.email || "",
      phone: companyConfig?.phone || "",
    },
  });

  const infinitePayForm = useForm<z.infer<typeof infinitePaySchema>>({
    resolver: zodResolver(infinitePaySchema),
    defaultValues: {
      handle: infinitePayConfig?.handle || "",
      docNumber: infinitePayConfig?.docNumber || "",
    },
  });

  const isInfinitePayConfigured = Boolean(infinitePayConfig?.configured);
  const isInfinitePayReadOnly =
    isInfinitePayConfigured && !isEditingInfinitePay;

  useEffect(() => {
    companyForm.reset({
      businessName: companyConfig?.businessName || "",
      document: companyConfig?.document || "",
      email: companyConfig?.email || "",
      phone: companyConfig?.phone || "",
    });
    setLogoFile(null);
  }, [companyConfig, companyForm]);

  useEffect(() => {
    if (isEditingInfinitePay) {
      return;
    }

    infinitePayForm.reset({
      handle: infinitePayConfig?.handle || "",
      docNumber: infinitePayConfig?.docNumber || "",
    });
  }, [infinitePayConfig, infinitePayForm, isEditingInfinitePay]);

  const handleInfinitePayButtonClick = (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (!isInfinitePayReadOnly) {
      return;
    }

    event.preventDefault();
    onEditInfinitePay();
  };

  const onCompanySubmit = (data: z.infer<typeof companySchema>) => {
    onUpdateCompany({
      businessName: data.businessName,
      document: data.document,
      email: data.email,
      phone: data.phone,
      logo: logoFile,
    });
  };

  const onInfinitePaySubmit = (data: z.infer<typeof infinitePaySchema>) => {
    onUpdateInfinitePay({
      handle: data.handle,
      docNumber: data.docNumber,
    });
  };

  // Access denied state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
            <div className="flex size-20 items-center justify-center rounded-full bg-rose-950/30 ring-1 ring-rose-900/50">
              <Loader2 className="size-8 text-rose-500" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-500">
                Erro de Acesso
              </h3>
              <p className="mt-1 max-w-xs text-xs text-rose-500/70">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-lg font-semibold uppercase tracking-wide text-white">
              Configurações da Empresa
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Configure os dados da sua empresa e integrações
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Config Card */}
            <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
              <CardHeader className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-blue-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                    Dados da Empresa
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingCompany ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <Form {...companyForm}>
                    <form
                      onSubmit={companyForm.handleSubmit(onCompanySubmit)}
                      className="space-y-4"
                    >
                      <CompanyLogoUpload
                        currentLogoUrl={companyConfig?.logoUrl}
                        logoFile={logoFile}
                        disabled={isUpdatingCompany}
                        onLogoSelect={setLogoFile}
                      />

                      <FormField
                        control={companyForm.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Nome da Empresa
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="Minha Empresa LTDA"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              CNPJ/CPF
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="00.000.000/0000-00"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="contato@empresa.com"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Telefone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="(00) 00000-0000"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isUpdatingCompany}
                        className="w-full h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] disabled:opacity-50"
                      >
                        {isUpdatingCompany ? (
                          <>
                            <Loader2 className="mr-2 size-3.5 animate-spin" />
                            Salvando…
                          </>
                        ) : (
                          "Salvar Dados da Empresa"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* InfinitePay Config Card */}
            <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
              <CardHeader className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-emerald-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                    InfinitePay
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingInfinitePay ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <Form {...infinitePayForm}>
                    <form
                      onSubmit={infinitePayForm.handleSubmit(onInfinitePaySubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={infinitePayForm.control}
                        name="handle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Handle
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={isInfinitePayReadOnly}
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="sua-empresa"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={infinitePayForm.control}
                        name="docNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Número do Documento
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={isInfinitePayReadOnly}
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                                placeholder="00000000000000"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      {infinitePayConfig?.configured && (
                        <div className="rounded-[4px] border border-emerald-900/30 bg-emerald-950/10 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            Configurado
                          </p>
                          <p className="text-xs text-emerald-500/70 mt-0.5">
                            Integração com InfinitePay ativa
                          </p>
                        </div>
                      )}

                      {isInfinitePayReadOnly ? (
                        <Button
                          type="button"
                          onClick={handleInfinitePayButtonClick}
                          disabled={isUpdatingInfinitePay}
                          className="w-full h-10 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-50"
                        >
                          Editar Configuração
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isUpdatingInfinitePay}
                          className="w-full h-10 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-50"
                        >
                          {isUpdatingInfinitePay ? (
                            <>
                              <Loader2 className="mr-2 size-3.5 animate-spin" />
                              Salvando…
                            </>
                          ) : (
                            "Salvar Configuração"
                          )}
                        </Button>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
