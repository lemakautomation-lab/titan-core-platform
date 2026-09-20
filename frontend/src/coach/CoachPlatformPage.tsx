import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  addCoachAthlete,
  createCoachSquad,
  createCoachTeam,
  createCoachTrainingProgramme,
  getCoachAthleteMonitoring,
  getCoachAthletes,
  getCoachSquads,
  getCoachTeams,
  removeCoachAthlete,
  type CoachAthleteDto,
  type CoachMonitoringDto,
  type CoachSquadDto,
  type CoachTeamDto,
} from "./coach.api";

export default function CoachPlatformPage() {
  const [squads, setSquads] =
    useState<CoachSquadDto[]>([]);
  const [teams, setTeams] =
    useState<CoachTeamDto[]>([]);
  const [athletes, setAthletes] =
    useState<CoachAthleteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [squadName, setSquadName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [athleteId, setAthleteId] = useState("");

  const [trainingAthleteId, setTrainingAthleteId] =
    useState("");
  const [trainingName, setTrainingName] =
    useState("");
  const [trainingGoal, setTrainingGoal] =
    useState("");
  const [trainingExperience, setTrainingExperience] =
    useState("");
  const [trainingFrequency, setTrainingFrequency] =
    useState("");
  const [sessionDuration, setSessionDuration] =
    useState("");

  const [monitoring, setMonitoring] =
    useState<CoachMonitoringDto | null>(null);

  async function loadPlatform() {
    const [nextSquads, nextTeams, nextAthletes] =
      await Promise.all([
        getCoachSquads(),
        getCoachTeams(),
        getCoachAthletes(),
      ]);

    setSquads(nextSquads);
    setTeams(nextTeams);
    setAthletes(nextAthletes);
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getCoachSquads(),
      getCoachTeams(),
      getCoachAthletes(),
    ])
      .then(([nextSquads, nextTeams, nextAthletes]) => {
        if (!mounted) return;
        setSquads(nextSquads);
        setTeams(nextTeams);
        setAthletes(nextAthletes);
      })
      .catch(() => {
        if (mounted) {
          setError(
            "Coach operations are temporarily unavailable.",
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function submitSquad(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const name = squadName.trim();
    if (!name) return;

    try {
      await createCoachSquad(name);
      setSquadName("");
      await loadPlatform();
    } catch {
      setError("The squad could not be created.");
    }
  }

  async function submitTeam(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const name = teamName.trim();
    if (!name) return;

    try {
      await createCoachTeam(name);
      setTeamName("");
      await loadPlatform();
    } catch {
      setError("The team could not be created.");
    }
  }

  async function submitAthlete(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const id = athleteId.trim();

    if (!id) {
      setError("Enter an Athlete ID.");
      return;
    }

    try {
      await addCoachAthlete(id);
      setAthleteId("");
      await loadPlatform();
    } catch {
      setError("The Athlete could not be added.");
    }
  }

  async function removeAthlete(
    athlete: CoachAthleteDto,
  ) {
    try {
      await removeCoachAthlete(athlete.athleteId);
      setAthletes((current) =>
        current.filter(
          (item) =>
            item.athleteId !== athlete.athleteId,
        ),
      );
    } catch {
      setError("The Athlete could not be removed.");
    }
  }

  async function viewMonitoring(
    athlete: CoachAthleteDto,
  ) {
    try {
      setMonitoring(
        await getCoachAthleteMonitoring(
          athlete.athleteId,
        ),
      );
    } catch {
      setError(
        "Athlete performance monitoring is temporarily unavailable.",
      );
    }
  }

  async function submitTraining(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const id = trainingAthleteId.trim();
    const name = trainingName.trim();
    const goal = trainingGoal.trim();
    const experience = trainingExperience.trim();
    const frequency = Number(trainingFrequency);
    const duration = Number(sessionDuration);

    if (
      !id ||
      !name ||
      !goal ||
      !experience ||
      !Number.isInteger(frequency) ||
      frequency < 1 ||
      !Number.isInteger(duration) ||
      duration < 1
    ) {
      setError(
        "Complete all training fields with valid positive numbers.",
      );
      return;
    }

    try {
      await createCoachTrainingProgramme({
        athleteId: id,
        name,
        goal,
        experience,
        trainingFrequency: frequency,
        sessionDurationMinutes: duration,
        sportId: null,
      });

      setTrainingAthleteId("");
      setTrainingName("");
      setTrainingGoal("");
      setTrainingExperience("");
      setTrainingFrequency("");
      setSessionDuration("");
    } catch {
      setError(
        "The training programme could not be created.",
      );
    }
  }

  if (loading) {
    return (
      <main className="titan-dashboard-page">
        <p role="status">
          Loading Coach operations...
        </p>
      </main>
    );
  }

  return (
    <main className="titan-dashboard-page">
      <section className="titan-panel">
        <span className="titan-eyebrow">
          COACH PLATFORM
        </span>
        <h2>Coach operations</h2>
        <p>
          Manage squads, teams, Athletes, training and
          authorised performance monitoring.
        </p>

        {error && <p role="alert">{error}</p>}
      </section>

      <section
        className="titan-panel"
        aria-label="Squad management"
      >
        <h3>Squads</h3>
        <form onSubmit={submitSquad}>
          <label>
            Squad name
            <input
              value={squadName}
              onChange={(event) =>
                setSquadName(event.target.value)
              }
            />
          </label>
          <button type="submit">Create squad</button>
        </form>

        {squads.length === 0 ? (
          <p>No squads yet.</p>
        ) : (
          squads.map((squad) => (
            <p key={squad.id}>
              {squad.name} — {squad.status}
            </p>
          ))
        )}
      </section>

      <section
        className="titan-panel"
        aria-label="Team management"
      >
        <h3>Teams</h3>
        <form onSubmit={submitTeam}>
          <label>
            Team name
            <input
              value={teamName}
              onChange={(event) =>
                setTeamName(event.target.value)
              }
            />
          </label>
          <button type="submit">Create team</button>
        </form>

        {teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          teams.map((team) => (
            <p key={team.id}>
              {team.name} — {team.status}
            </p>
          ))
        )}
      </section>

      <section
        className="titan-panel"
        aria-label="Athlete management"
      >
        <h3>Athletes</h3>

        <form onSubmit={submitAthlete}>
          <label>
            Athlete ID
            <input
              value={athleteId}
              onChange={(event) =>
                setAthleteId(event.target.value)
              }
            />
          </label>
          <button type="submit">Add Athlete</button>
        </form>

        {athletes.length === 0 ? (
          <p>No active Coach Athletes yet.</p>
        ) : (
          athletes.map((athlete) => (
            <article key={athlete.relationshipId}>
              <h4>
                {athlete.firstName} {athlete.lastName}
              </h4>
              <p>Relationship: {athlete.relationshipStatus}</p>

              <button
                type="button"
                onClick={() => {
                  void viewMonitoring(athlete);
                }}
              >
                View performance
              </button>

              <button
                type="button"
                onClick={() => {
                  void removeAthlete(athlete);
                }}
              >
                Remove Athlete
              </button>
            </article>
          ))
        )}
      </section>

      <section
        className="titan-panel"
        aria-label="Training management"
      >
        <h3>Training</h3>

        <form onSubmit={submitTraining}>
          <label>
            Training Athlete ID
            <input
              value={trainingAthleteId}
              onChange={(event) =>
                setTrainingAthleteId(event.target.value)
              }
            />
          </label>

          <label>
            Programme name
            <input
              value={trainingName}
              onChange={(event) =>
                setTrainingName(event.target.value)
              }
            />
          </label>

          <label>
            Goal
            <input
              value={trainingGoal}
              onChange={(event) =>
                setTrainingGoal(event.target.value)
              }
            />
          </label>

          <label>
            Experience
            <input
              value={trainingExperience}
              onChange={(event) =>
                setTrainingExperience(event.target.value)
              }
            />
          </label>

          <label>
            Training frequency
            <input
              type="number"
              min="1"
              value={trainingFrequency}
              onChange={(event) =>
                setTrainingFrequency(event.target.value)
              }
            />
          </label>

          <label>
            Session duration (minutes)
            <input
              type="number"
              min="1"
              value={sessionDuration}
              onChange={(event) =>
                setSessionDuration(event.target.value)
              }
            />
          </label>

          <button type="submit">
            Create training programme
          </button>
        </form>
      </section>

      {monitoring && (
        <section
          className="titan-panel"
          aria-label="Performance monitoring"
        >
          <h3>Performance monitoring</h3>
          <p>
            Athlete: <strong>{monitoring.athleteId}</strong>
          </p>
          <p>
            Performance metrics: {monitoring.performance.length}
          </p>
          <p>
            Recovery observations: {monitoring.recovery.length}
          </p>
          <p>
            Training stress observations:{" "}
            {monitoring.trainingStress.length}
          </p>
          <p>
            Workout programmes:{" "}
            {monitoring.workoutProgrammes.length}
          </p>
        </section>
      )}
    </main>
  );
}
