import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Breadcrumb } from "./breadcrumb";

const backMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: backMock,
  }),
}));

vi.mock("./breadcrumb-context", () => ({
  useBreadcrumbContext: () => ({
    breadcrumb: {
      title: "Produto Teste",
      backUrl: "/products",
      section: "Produtos",
      subsection: "Detalhes",
    },
  }),
}));

describe("Breadcrumb", () => {
  it("uses router.back when clicking back button", () => {
    render(<Breadcrumb />);

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
