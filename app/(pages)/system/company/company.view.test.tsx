import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompanyView } from "./company.view";
import type { CompanyViewProps } from "./company.types";

afterEach(() => {
  cleanup();
});

const baseProps: CompanyViewProps = {
  companyConfig: {
    businessName: "Zirael",
    document: "06108851465",
    email: "pass@pass.com",
    phone: "(81) 99999-9999",
    logoUrl: null,
    isActive: true,
  },
  infinitePayConfig: {
    handle: "zirael",
    docNumber: "06108851465",
    configured: true,
  },
  isLoadingCompany: false,
  isLoadingInfinitePay: false,
  isUpdatingCompany: false,
  isUpdatingInfinitePay: false,
  isEditingInfinitePay: true,
  error: null,
  onUpdateCompany: vi.fn(),
  onUpdateInfinitePay: vi.fn(),
  onEditInfinitePay: vi.fn(),
};

describe("CompanyView", () => {
  it("shows loading only on company button while company request is pending", () => {
    render(<CompanyView {...baseProps} isUpdatingCompany />);

    const companyButton = screen.getByRole("button", {
      name: /salvando/i,
    }) as HTMLButtonElement;
    const infinitePayButton = screen.getByRole("button", {
      name: /salvar configuração/i,
    }) as HTMLButtonElement;

    expect(companyButton.disabled).toBe(true);
    expect(infinitePayButton.disabled).toBe(false);
    expect(screen.queryByRole("button", {
      name: /salvar dados da empresa/i,
    })).toBeNull();
  });

  it("shows loading only on InfinitePay button while InfinitePay request is pending", () => {
    render(<CompanyView {...baseProps} isUpdatingInfinitePay />);

    const companyButton = screen.getByRole("button", {
      name: /salvar dados da empresa/i,
    }) as HTMLButtonElement;
    const infinitePayButton = screen.getByRole("button", {
      name: /salvando/i,
    }) as HTMLButtonElement;

    expect(companyButton.disabled).toBe(false);
    expect(infinitePayButton.disabled).toBe(true);
    expect(screen.queryByRole("button", {
      name: /salvar configuração/i,
    })).toBeNull();
  });
});
