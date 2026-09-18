import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  addMyTrainerClient,
  getMyTrainerClients,
  removeMyTrainerClient,
  type TrainerClientDto,
} from "./trainer-clients.api";

export default function TrainerClientManagement() {
  const [clients, setClients] =
    useState<TrainerClientDto[]>([]);

  const [athleteId, setAthleteId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [adding, setAdding] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  async function loadClients() {
    const result =
      await getMyTrainerClients();

    setClients(result);
  }

  useEffect(() => {
    let mounted = true;

    void getMyTrainerClients()
      .then((result) => {
        if (mounted) {
          setClients(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function addClient(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const id = athleteId.trim();

    if (!id) {
      setActionError(
        "Enter an Athlete ID before adding a client.",
      );
      return;
    }

    setAdding(true);
    setActionError(null);

    try {
      await addMyTrainerClient(id);
      await loadClients();
      setAthleteId("");
    }
    catch {
      setActionError(
        "The Athlete could not be added to your client roster.",
      );
    }
    finally {
      setAdding(false);
    }
  }

  async function removeClient(
    client: TrainerClientDto,
  ) {
    setRemovingId(client.athleteId);
    setActionError(null);

    try {
      await removeMyTrainerClient(
        client.athleteId,
      );

      setClients((current) =>
        current.filter(
          (item) =>
            item.athleteId !==
            client.athleteId,
        ),
      );
    }
    catch {
      setActionError(
        "The client could not be removed from your roster.",
      );
    }
    finally {
      setRemovingId(null);
    }
  }

  return (
    <section
      className="titan-panel titan-trainer-clients"
      aria-label="Client management"
    >
      <span className="titan-eyebrow">
        CLIENT MANAGEMENT
      </span>

      <h2>My clients</h2>

      <p>
        Manage the Athletes currently connected to
        your Trainer account.
      </p>

      <form onSubmit={addClient}>
        <label>
          Athlete ID
          <input
            name="athleteId"
            value={athleteId}
            onChange={(event) =>
              setAthleteId(
                event.target.value,
              )
            }
            autoComplete="off"
            placeholder="Enter Athlete ID"
          />
        </label>

        <button
          type="submit"
          disabled={adding}
        >
          {adding
            ? "Adding client..."
            : "Add client"}
        </button>
      </form>

      {actionError && (
        <p role="alert">
          {actionError}
        </p>
      )}

      {loading && (
        <p role="status">
          Loading your client roster...
        </p>
      )}

      {!loading && loadError && (
        <p role="alert">
          Your client roster is temporarily
          unavailable.
        </p>
      )}

      {!loading &&
        !loadError &&
        clients.length === 0 && (
          <p>
            You do not have any active clients yet.
          </p>
        )}

      {!loading &&
        !loadError &&
        clients.length > 0 && (
          <section
            className="titan-client-roster"
            aria-label="Active Trainer clients"
          >
            {clients.map((client) => (
              <article
                key={client.relationshipId}
                className="titan-client-card"
              >
                <span className="titan-eyebrow">
                  ACTIVE CLIENT
                </span>

                <h3>
                  {client.firstName}{" "}
                  {client.lastName}
                </h3>

                <p>
                  Athlete ID:{" "}
                  <strong>
                    {client.athleteId}
                  </strong>
                </p>

                {client.countryCode && (
                  <p>
                    Country:{" "}
                    {client.countryCode}
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    removingId ===
                    client.athleteId
                  }
                  onClick={() => {
                    void removeClient(
                      client,
                    );
                  }}
                >
                  {removingId ===
                  client.athleteId
                    ? "Removing..."
                    : "Remove client"}
                </button>
              </article>
            ))}
          </section>
        )}
    </section>
  );
}
