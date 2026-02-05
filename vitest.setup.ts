// Set environment variables for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:9000";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverMock;
}
