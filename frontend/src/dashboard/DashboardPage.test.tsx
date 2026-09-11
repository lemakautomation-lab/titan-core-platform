import {
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders the canonical dashboard", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "PERFORMANCE COMMAND CENTRE",
      ),
    ).toBeInTheDocument();
  });
});
