import {
  useEffect,
} from "react";
import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AuthorizedBodyData, {
  BODY_DATA_READ_PERMISSION,
} from "./AuthorizedBodyData";

afterEach(cleanup);

describe("authorised body data", () => {
  it("renders body data with the required permission", () => {
    render(
      <AuthorizedBodyData
        permissions={[BODY_DATA_READ_PERMISSION]}
      >
        <p>Protected body mapping</p>
      </AuthorizedBodyData>,
    );

    expect(
      screen.getByLabelText("Authorised body data"),
    ).toHaveTextContent("Protected body mapping");

    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
  });

  it("normalizes the supplied permission code", () => {
    render(
      <AuthorizedBodyData
        permissions={[
          "  ATHLETE_DIGITAL_TWINS.READ  ",
        ]}
      >
        <p>Protected body mapping</p>
      </AuthorizedBodyData>,
    );

    expect(
      screen.getByText("Protected body mapping"),
    ).toBeInTheDocument();
  });

  it("denies access without the required permission", () => {
    render(
      <AuthorizedBodyData
        permissions={["athlete_digital_twins.update"]}
      >
        <p>Protected body mapping</p>
      </AuthorizedBodyData>,
    );

    expect(screen.getByRole("alert"))
      .toHaveTextContent(
        "You do not have permission to view this athlete body data.",
      );

    expect(
      screen.queryByText("Protected body mapping"),
    ).not.toBeInTheDocument();
  });

  it("does not mount protected body-data children when denied", () => {
    const mounted=vi.fn();

    function ProtectedBodyData() {
      useEffect(() => {
        mounted();
      }, []);

      return <p>Confidential athlete data</p>;
    }

    render(
      <AuthorizedBodyData permissions={[]}>
        <ProtectedBodyData />
      </AuthorizedBodyData>,
    );

    expect(mounted).not.toHaveBeenCalled();

    expect(
      screen.queryByText("Confidential athlete data"),
    ).not.toBeInTheDocument();
  });
});
