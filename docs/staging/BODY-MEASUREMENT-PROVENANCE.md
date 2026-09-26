# Body-fat provenance increment

The existing AthleteBodyMeasurement row remains append-only. New self-reported
body-fat observations must include a controlled measurement method; the server
records source `ATHLETE_MANUAL`. This means the Athlete reported a result using
that method, not that TITAN verified the device or procedure. Historic values
have null method/source; never backfill a guess. Height, weight and calculated
BMI are unchanged. This increment does not infer regional fat loss, muscle
change, or clinical accuracy. Further circumference and composition metrics
require their own observed-at, method, source and unit contracts.
