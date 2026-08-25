import { useEffect, useState } from "react";

import { listUsers } from "./users.api";
import { UserDto } from "./users.types";

interface UsersPageProps {
  tenantId: string;
}

export default function UsersPage({
  tenantId,
}: UsersPageProps) {

  const [users, setUsers] =
    useState<UserDto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {

    let mounted = true;

    async function loadUsers() {

      setLoading(true);
      setError(null);

      try {

        const result =
          await listUsers(tenantId);

        if (mounted) {
          setUsers(result);
        }

      } catch {

        if (mounted) {
          setError(
            "Unable to load users. Please try again.",
          );
        }

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    }

    void loadUsers();

    return () => {
      mounted = false;
    };

  }, [tenantId]);

  return (
    <section className="titan-users-page">

      <div className="titan-page-heading">

        <div>

          <span className="titan-eyebrow">
            ADMINISTRATION
          </span>

          <h2>
            Users
          </h2>

        </div>

        <div className="titan-tenant">

          <span>
            Tenant
          </span>

          <strong>
            {tenantId}
          </strong>

        </div>

      </div>

      <section className="titan-panel titan-users-panel">

        <div className="titan-users-header">

          <div>
            <span className="titan-eyebrow">
              USER DIRECTORY
            </span>

            <h3>
              Tenant users
            </h3>
          </div>

          {!loading && !error && (
            <span className="titan-user-count">
              {users.length} user{users.length === 1 ? "" : "s"}
            </span>
          )}

        </div>

        {loading && (
          <div className="titan-users-state">
            Loading users...
          </div>
        )}

        {error && (
          <div
            className="titan-users-state titan-users-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="titan-users-state">
            No users found for this tenant.
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="titan-users-table-wrapper">

            <table className="titan-users-table">

              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Organisation</th>
                </tr>
              </thead>

              <tbody>

                {users.map((user) => (

                  <tr key={user.id}>

                    <td>
                      <strong>
                        {user.email}
                      </strong>
                    </td>

                    <td>
                      {[
                        user.firstName,
                        user.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>

                    <td>
                      <span className="titan-user-status">
                        {user.status}
                      </span>
                    </td>

                    <td>
                      {user.organisationId || "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </section>
  );
}