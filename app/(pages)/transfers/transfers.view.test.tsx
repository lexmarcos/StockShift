import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TransfersView } from "./transfers.view";
import { TransferStatus, Transfer } from "./transfers.types";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="icon-plus" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  ArrowUpRight: () => <span data-testid="icon-arrow-up-right" />,
  ArrowDownLeft: () => <span data-testid="icon-arrow-down-left" />,
  Package: () => <span data-testid="icon-package" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Truck: () => <span data-testid="icon-truck" />,
  Clock: () => <span data-testid="icon-clock" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  Send: () => <span data-testid="icon-send" />,
  Inbox: () => <span data-testid="icon-inbox" />,
  Loader2: () => <span data-testid="icon-loader" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

// Mock Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
      items: [
        { id: "i1", sourceBatchId: "b1", quantity: 10, productName: "Item 1" },
      ],
      createdAt: "2023-01-01T00:00:00Z",
    },
  ];

  const defaultProps = {
    transfers: mockTransfers,
    isLoading: false,
    error: null,
    activeTab: "outgoing" as const,
    onTabChange: vi.fn(),
    stats: { total: 1, inTransit: 0, pending: 1, completed: 0 },
    onRetry: vi.fn(),
  };

  it("renders the header and tab buttons", () => {
    render(<TransfersView {...defaultProps} />);
    expect(screen.getByText("Transferências")).toBeDefined();
    expect(screen.getByText("Enviadas")).toBeDefined();
    expect(screen.getByText("Recebidas")).toBeDefined();
  });

  it("renders the new transfer button only on outgoing tab", () => {
    const { rerender } = render(
      <TransfersView {...defaultProps} activeTab="outgoing" />,
    );
    expect(screen.queryByText("Nova Transferência")).toBeDefined();

    rerender(<TransfersView {...defaultProps} activeTab="incoming" />);
    expect(screen.queryByText("Nova Transferência")).toBeNull();
  });

  it("renders transfer cards correctly", () => {
    render(<TransfersView {...defaultProps} />);
    expect(screen.getAllByText("TR-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Warehouse B").length).toBeGreaterThan(0);
    expect(screen.getByText("1 itens")).toBeDefined();
  });

  it("shows empty state when no transfers", () => {
    render(<TransfersView {...defaultProps} transfers={[]} />);
    expect(screen.getByText("Nenhuma transferência encontrada")).toBeDefined();
  });
});
