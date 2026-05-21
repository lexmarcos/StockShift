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

export const CompanyView = (props: CompanyViewProps) => {
  const {
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
  } = props;
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
            <CompanyConfigCard
              companyConfig={companyConfig}
              companyForm={companyForm}
              isLoadingCompany={isLoadingCompany}
              isUpdatingCompany={isUpdatingCompany}
              logoFile={logoFile}
              onCompanySubmit={onCompanySubmit}
              setLogoFile={setLogoFile}
            />
            <InfinitePayConfigCard
              form={infinitePayForm}
              infinitePayConfig={infinitePayConfig}
              isInfinitePayReadOnly={isInfinitePayReadOnly}
              isLoadingInfinitePay={isLoadingInfinitePay}
              isUpdatingInfinitePay={isUpdatingInfinitePay}
              onButtonClick={handleInfinitePayButtonClick}
              onSubmit={onInfinitePaySubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

type CompanyFormValues = z.infer<typeof companySchema>;
type InfinitePayFormValues = z.infer<typeof infinitePaySchema>;

function CompanyConfigCard({
  companyConfig,
  companyForm,
  isLoadingCompany,
  isUpdatingCompany,
  logoFile,
  onCompanySubmit,
  setLogoFile,
}: {
  companyConfig: CompanyViewProps["companyConfig"];
  companyForm: ReturnType<typeof useForm<CompanyFormValues>>;
  isLoadingCompany: boolean;
  isUpdatingCompany: boolean;
  logoFile: File | null;
  onCompanySubmit: (data: CompanyFormValues) => void;
  setLogoFile: (file: File | null) => void;
}) {
  return (
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
          <CompanyCardLoader className="text-blue-500" />
        ) : (
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
              <CompanyLogoUpload
                currentLogoUrl={companyConfig?.logoUrl}
                logoFile={logoFile}
                disabled={isUpdatingCompany}
                onLogoSelect={setLogoFile}
              />
              <CompanyTextField form={companyForm} name="businessName" label="Nome da Empresa" placeholder="Minha Empresa LTDA" />
              <CompanyTextField form={companyForm} name="document" label="CNPJ/CPF" placeholder="00.000.000/0000-00" />
              <CompanyTextField form={companyForm} name="email" label="Email" placeholder="contato@empresa.com" type="email" />
              <CompanyTextField form={companyForm} name="phone" label="Telefone" placeholder="(00) 00000-0000" />
              <Button
                type="submit"
                disabled={isUpdatingCompany}
                className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 disabled:opacity-50"
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
  );
}

function CompanyTextField({
  form,
  label,
  name,
  placeholder,
  type = "text",
}: {
  form: ReturnType<typeof useForm<CompanyFormValues>>;
  label: string;
  name: keyof CompanyFormValues;
  placeholder: string;
  type?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function InfinitePayConfigCard({
  form,
  infinitePayConfig,
  isInfinitePayReadOnly,
  isLoadingInfinitePay,
  isUpdatingInfinitePay,
  onButtonClick,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<InfinitePayFormValues>>;
  infinitePayConfig: CompanyViewProps["infinitePayConfig"];
  isInfinitePayReadOnly: boolean;
  isLoadingInfinitePay: boolean;
  isUpdatingInfinitePay: boolean;
  onButtonClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onSubmit: (data: InfinitePayFormValues) => void;
}) {
  return (
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
          <CompanyCardLoader className="text-emerald-500" />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <InfinitePayTextField form={form} isReadOnly={isInfinitePayReadOnly} name="handle" label="Handle" placeholder="sua-empresa" />
              <InfinitePayTextField form={form} isReadOnly={isInfinitePayReadOnly} name="docNumber" label="Número do Documento" placeholder="00000000000000" />
              {infinitePayConfig?.configured ? <InfinitePayConfiguredNotice /> : null}
              <InfinitePaySubmitButton
                isReadOnly={isInfinitePayReadOnly}
                isUpdating={isUpdatingInfinitePay}
                onButtonClick={onButtonClick}
              />
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

function InfinitePayTextField({
  form,
  isReadOnly,
  label,
  name,
  placeholder,
}: {
  form: ReturnType<typeof useForm<InfinitePayFormValues>>;
  isReadOnly: boolean;
  label: string;
  name: keyof InfinitePayFormValues;
  placeholder: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              readOnly={isReadOnly}
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function InfinitePayConfiguredNotice() {
  return (
    <div className="rounded-[4px] border border-emerald-900/30 bg-emerald-950/10 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
        Configurado
      </p>
      <p className="mt-0.5 text-xs text-emerald-500/70">
        Integração com InfinitePay ativa
      </p>
    </div>
  );
}

function InfinitePaySubmitButton({
  isReadOnly,
  isUpdating,
  onButtonClick,
}: {
  isReadOnly: boolean;
  isUpdating: boolean;
  onButtonClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (isReadOnly) {
    return (
      <Button
        type="button"
        onClick={onButtonClick}
        disabled={isUpdating}
        className="h-10 w-full rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] hover:bg-emerald-700 disabled:opacity-50"
      >
        Editar Configuração
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      disabled={isUpdating}
      className="h-10 w-full rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] hover:bg-emerald-700 disabled:opacity-50"
    >
      {isUpdating ? (
        <>
          <Loader2 className="mr-2 size-3.5 animate-spin" />
          Salvando…
        </>
      ) : (
        "Salvar Configuração"
      )}
    </Button>
  );
}

function CompanyCardLoader({ className }: { className: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`size-6 animate-spin ${className}`} />
    </div>
  );
}
