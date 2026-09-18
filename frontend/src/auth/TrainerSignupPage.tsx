import {
  type FormEvent,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { registerTrainer } from "./auth.service";
import type { AuthUser } from "./auth.types";

interface TrainerSignupPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

export default function TrainerSignupPage({
  onAuthenticated,
}: TrainerSignupPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await registerTrainer({
        firstName,
        lastName,
        email,
        password,
      });

      onAuthenticated(user);
    } catch {
      setError(
        "Unable to create your Trainer account. Check your details or sign in if the email is already registered.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>TITAN Health</h1>
      <h2>Create your Trainer account</h2>

      <p>
        Create your professional account to begin
        Trainer onboarding. Paid Trainer platform
        access is activated only after successful
        payment.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="trainerFirstName">
            First name
          </label>
          <input
            id="trainerFirstName"
            name="firstName"
            value={firstName}
            onChange={(event) =>
              setFirstName(event.target.value)
            }
            required
            autoComplete="given-name"
          />
        </div>

        <div>
          <label htmlFor="trainerLastName">
            Last name
          </label>
          <input
            id="trainerLastName"
            name="lastName"
            value={lastName}
            onChange={(event) =>
              setLastName(event.target.value)
            }
            required
            autoComplete="family-name"
          />
        </div>

        <div>
          <label htmlFor="trainerSignupEmail">
            Email
          </label>
          <input
            id="trainerSignupEmail"
            name="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="trainerSignupPassword">
            Password
          </label>
          <input
            id="trainerSignupPassword"
            name="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {
            loading
              ? "Creating account..."
              : "Create Trainer account"
          }
        </button>
      </form>

      <p>
        Already registered?{" "}
        <Link to="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}