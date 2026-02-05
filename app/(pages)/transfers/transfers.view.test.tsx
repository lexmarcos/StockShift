import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TransfersView } from "./transfers.view";
import { TransferStatus, Transfer } from "./transfers.types";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="icon-plus" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Package: () => <span data-testid="icon-package" />,
  Calendar: () => <span data-testid="icon-calendar" />,
}));

// Mock Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe("TransfersView", () => {
  const mockTransfers: Transfer[] = [
    {
      id: "1",
      code: "TR-001",
      sourceWarehouseId: "wh1",
      sourceWarehouseName: "Warehouse A",
      destinationWarehouseId: "wh2",
      destinationWarehouseName: "Warehouse B",
      status: TransferStatus.DRAFT,
      items: [{ id: "i1", sourceBatchId: "b1", quantity: 10, productName: "Item 1" }],
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
  ];

  const defaultProps = {
    transfers: mockTransfers,
    isLoading: false,
    error: null,
    activeTab: "outgoing" as const,
    onTabChange: vi.fn(),
  };

  it("renders the header and tabs", () => {
    render(<TransfersView {...defaultProps} />);
    expect(screen.getByText("Transferências")).toBeDefined();
    expect(screen.getByRole("tab", { name: /enviadas/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /recebidas/i })).toBeDefined();
  });

  it("renders the new transfer button only on outgoing tab", () => {
    const { rerender } = render(<TransfersView {...defaultProps} activeTab="outgoing" />);
    expect(screen.queryByText("Nova Transferência")).toBeDefined();

    rerender(<TransfersView {...defaultProps} activeTab="incoming" />);
    expect(screen.queryByText("Nova Transferência")).toBeNull();
  });

  it("renders transfer cards correctly", () => {
    render(<TransfersView {...defaultProps} />);
    // Check for transfer code
    expect(screen.getAllByText("TR-001").length).toBeGreaterThan(0);
    // Check for warehouse name
    expect(screen.getAllByText("Warehouse B").length).toBeGreaterThan(0);
    // Check for item count
    expect(screen.getAllByText("10 itens").length).toBeGreaterThan(0);
  });

  it("reflects active tab state", () => {
    // We check if the tabs have the correct data-state attribute based on props
    const { rerender } = render(<TransfersView {...defaultProps} activeTab="outgoing" />);
    const outgoingTab = screen.getByRole("tab", { name: /enviadas/i });
    const incomingTab = screen.getByRole("tab", { name: /recebidas/i });

    // Note: Radix UI uses data-state="active" or "inactive"
    // Since we are mocking or running in JSDOM, we check if the prop is passed down correctly
    // indirectly by checking if the content is rendered or the tab styling class is applied if possible.
    // However, simply checking existence of elements is safer.
    
    expect(outgoingTab.getAttribute("data-state")).toBe("active");
    expect(incomingTab.getAttribute("data-state")).toBe("inactive");

    rerender(<TransfersView {...defaultProps} activeTab="incoming" />);
    
    // Re-query elements as they might be re-rendered
    const outgoingTab2 = screen.getByRole("tab", { name: /enviadas/i });
    const incomingTab2 = screen.getByRole("tab", { name: /recebidas/i });
    
    expect(outgoingTab2.getAttribute("data-state")).toBe("inactive");
    expect(incomingTab2.getAttribute("data-state")).toBe("active");
  });

  it("shows empty state when no transfers", () => {
    render(<TransfersView {...defaultProps} transfers={[]} />);
    expect(screen.getByText("Nenhuma transferência encontrada")).toBeDefined();
  });
});
