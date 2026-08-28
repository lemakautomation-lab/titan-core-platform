import { RecordStatus } from "../enums/record-status.enum";

export interface PerformanceMetricProps {
  id: string;
  tenantId: string;
  athleteId: string;
  sportId: string;
  name: string;
  slug: string;
  description?: string | null;
  unit?: string | null;
  dataType: string;
  status: RecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PerformanceMetric {
  private constructor(private readonly props: PerformanceMetricProps) {}

  static create(props: PerformanceMetricProps): PerformanceMetric {
    return new PerformanceMetric(props);
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

  get dataType(): string {
    return this.props.dataType;
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
