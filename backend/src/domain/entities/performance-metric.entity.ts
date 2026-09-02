import { RecordStatus } from "../enums/record-status.enum";

export const PERFORMANCE_METRIC_DATA_TYPES = [
  "NUMBER",
  "DECIMAL",
  "INTEGER",
] as const;

export type PerformanceMetricDataType =
  typeof PERFORMANCE_METRIC_DATA_TYPES[number];

export class PerformanceMetricValidationError extends Error {
  constructor(
    public readonly field: "dataType" | "unit",
    message: string,
  ) {
    super(message);
    this.name = "PerformanceMetricValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface PerformanceMetricProps {
  id: string;
  tenantId: string;
  athleteId: string;
  sportId: string;
  name: string;
  slug: string;
  description?: string | null;
  unit?: string | null;
  dataType: PerformanceMetricDataType | string;
  status: RecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PerformanceMetric {
  private constructor(private readonly props: PerformanceMetricProps) {}

  static create(props: PerformanceMetricProps): PerformanceMetric {
    return new PerformanceMetric({
      ...props,
      description: PerformanceMetric.normalizeDescription(
        props.description,
      ),
      unit: PerformanceMetric.normalizeUnit(props.unit),
      dataType: PerformanceMetric.normalizeDataType(props.dataType),
    });
  }

  static normalizeDataType(
    value: string,
  ): PerformanceMetricDataType {
    const normalized = value.trim().toUpperCase();

    if (
      !PERFORMANCE_METRIC_DATA_TYPES.includes(
        normalized as PerformanceMetricDataType,
      )
    ) {
      throw new PerformanceMetricValidationError(
        "dataType",
        "Performance metric dataType must be NUMBER, DECIMAL or INTEGER.",
      );
    }

    return normalized as PerformanceMetricDataType;
  }

  static normalizeUnit(
    value?: string | null,
  ): string | null {
    return value?.trim() || null;
  }

  static normalizeDescription(
    value?: string | null,
  ): string | null {
    return value?.trim() || null;
  }

  updateDetails(input: {
    name?: string;
    slug?: string;
    description?: string | null;
    unit?: string | null;
    dataType?: string;
    updatedAt: Date;
  }): PerformanceMetric {
    const suppliedUnit =
      input.unit === undefined
        ? this.unit ?? null
        : PerformanceMetric.normalizeUnit(input.unit);

    if (suppliedUnit !== (this.unit ?? null)) {
      throw new PerformanceMetricValidationError(
        "unit",
        "Performance metric unit cannot be changed after creation.",
      );
    }

    const suppliedDataType =
      input.dataType === undefined
        ? this.dataType
        : PerformanceMetric.normalizeDataType(input.dataType);

    if (suppliedDataType !== this.dataType) {
      throw new PerformanceMetricValidationError(
        "dataType",
        "Performance metric dataType cannot be changed after creation.",
      );
    }

    return PerformanceMetric.create({
      ...this.props,
      name: input.name?.trim() ?? this.name,
      slug: input.slug?.trim().toLowerCase() ?? this.slug,
      description:
        input.description === undefined
          ? this.description
          : PerformanceMetric.normalizeDescription(input.description),
      unit: this.unit,
      dataType: this.dataType,
      updatedAt: input.updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get athleteId(): string {
    return this.props.athleteId;
  }

  get sportId(): string {
    return this.props.sportId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get unit(): string | null | undefined {
    return this.props.unit;
  }

  get dataType(): PerformanceMetricDataType {
    return this.props.dataType as PerformanceMetricDataType;
  }

  get status(): RecordStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.status = RecordStatus.ACTIVE;
  }

  deactivate(): void {
    this.props.status = RecordStatus.INACTIVE;
  }
}
