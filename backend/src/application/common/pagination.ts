export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_PAGE_SIZE = 25;
export const PAGINATION_MAX_PAGE_SIZE = 100;

export interface PaginationInput {
    page: number;
    pageSize: number;
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

export function createPaginationMeta(
    page: number,
    pageSize: number,
    total: number,
): PaginationMeta {

    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}

export function parsePagination(
    pageValue: unknown,
    pageSizeValue: unknown,
): PaginationInput {

    const page =
        pageValue === undefined
            ? PAGINATION_DEFAULT_PAGE
            : Number(pageValue);

    const pageSize =
        pageSizeValue === undefined
            ? PAGINATION_DEFAULT_PAGE_SIZE
            : Number(pageSizeValue);

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        throw new Error(
            "Invalid page. Page must be a positive integer.",
        );
    }

    if (
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > PAGINATION_MAX_PAGE_SIZE
    ) {
        throw new Error(
            `Invalid pageSize. Page size must be an integer between 1 and ${PAGINATION_MAX_PAGE_SIZE}.`,
        );
    }

    return {
        page,
        pageSize,
    };
}
