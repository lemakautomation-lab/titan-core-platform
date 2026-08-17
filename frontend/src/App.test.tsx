import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the TITAN Core Platform", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "TITAN Core Platform" }),
    ).toBeInTheDocument();
  });
});
