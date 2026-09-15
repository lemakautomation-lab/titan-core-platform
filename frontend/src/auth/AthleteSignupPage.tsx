import {
  type FormEvent,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { registerAthlete } from "./auth.service";
import type { AuthUser } from "./auth.types";

interface AthleteSignupPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

export default function AthleteSignupPage({
  onAuthenticated,
}: AthleteSignupPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
      const user = await registerAthlete({
        firstName,
        lastName,
        email,
        password,
        countryCode,
        dateOfBirth,
      });

      onAuthenticated(user);
    } catch {
      setError(
        "Unable to create your account. Check your details or sign in if the email is already registered.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>TITAN Health</h1>
      <h2>Create your Athlete account</h2>

      <p>
        Create your account to begin onboarding.
        Paid platform access is activated only after
        successful payment.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
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
          <label htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
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
          <label htmlFor="signupEmail">
            Email
          </label>
          <input
            id="signupEmail"
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
          <label htmlFor="signupPassword">
            Password
          </label>
          <input
            id="signupPassword"
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

        <div>
          <label htmlFor="countryCode">
            Country code
          </label>
          <input
            id="countryCode"
            name="countryCode"
            value={countryCode}
            onChange={(event) =>
              setCountryCode(
                event.target.value.toUpperCase(),
              )
            }
            required
            minLength={2}
            maxLength={2}
            placeholder="ZA"
            autoComplete="country"
          />
        </div>

        <div>
          <label htmlFor="dateOfBirth">
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(event) =>
              setDateOfBirth(event.target.value)
            }
            required
            autoComplete="bday"
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
              : "Create Athlete account"
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
