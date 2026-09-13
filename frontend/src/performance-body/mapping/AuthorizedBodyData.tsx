import type {
  ReactNode,
} from "react";

export const BODY_DATA_READ_PERMISSION =
  "athlete_digital_twins.read";

interface AuthorizedBodyDataProps {
  permissions: readonly string[];
  children: ReactNode;
}

function normalize(permission: string): string {
  return permission.trim().toLowerCase();
}

export default function AuthorizedBodyData({
  permissions,
  children,
}: AuthorizedBodyDataProps) {
  const allowed = permissions
    .map(normalize)
    .includes(BODY_DATA_READ_PERMISSION);

  if (!allowed) {
    return (
      <section
        aria-label="Body data access denied"
        role="alert"
      >
        <h2>Access denied</h2>
        <p>
          You do not have permission to view this athlete body
          data.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Authorised body data">
      {children}
    </section>
  );
}
