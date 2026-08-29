import {
  Link,
  Outlet,
} from "react-router-dom";

import { AuthUser } from "./auth.types";

type AuthAppProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
  loggingOut: boolean;
};

export default function AuthApp({
  user,
  onLogout,
  loggingOut,
}: AuthAppProps) {
  return (
    <div>
      <header>
        <nav aria-label="Primary navigation">
          <Link to="/users">
            Users
          </Link>
        </nav>

        <div>
          <span>
            {user.email}
          </span>

          <button
            type="button"
            onClick={() => {
              void onLogout();
            }}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
