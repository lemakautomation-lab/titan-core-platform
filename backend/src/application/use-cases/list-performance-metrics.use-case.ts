import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";

import { ListPerformanceMetricsQuery } from "../queries/performance-metric/list-performance-metrics.query";

import { PerformanceMetricDto } from "../dto/performance-metric/performance-metric.dto";

import {
    PaginatedResult,
    createPaginationMeta,
} from "../common/pagination";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { PerformanceMetricMapper } from "../mappers/performance-metric.mapper";

export class ListPerformanceMetricsUseCase
implements UseCase<
    ListPerformanceMetricsQuery,
    Result<PaginatedResult<PerformanceMetricDto>>
>
{

    constructor(
        private readonly repository: PerformanceMetricRepository,
    ) {}

    async execute(
        query: ListPerformanceMetricsQuery,
    ): Promise<Result<PaginatedResult<PerformanceMetricDto>>> {

        const result =
            await this.repository.findAll(
                query.tenantId,
                {
                    page:
                        query.page,

                    pageSize:
                        query.pageSize,
                },
            );

        return Result.success({

            data:
                result.items.map(
                    PerformanceMetricMapper.toDto,
                ),

            pagination:
                createPaginationMeta(
                    query.page,
                    query.pageSize,
                    result.total,
                ),

        });

    }

}
