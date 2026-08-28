import {
    PaginationInput,
    PAGINATION_DEFAULT_PAGE,
    PAGINATION_DEFAULT_PAGE_SIZE,
} from "../../common/pagination";

export class ListSportsQuery {

    public readonly page: number;
    public readonly pageSize: number;

    constructor(
        public readonly tenantId: string,
        pagination: Partial<PaginationInput> = {},
    ) {

        this.page =
            pagination.page ??
            PAGINATION_DEFAULT_PAGE;

        this.pageSize =
            pagination.pageSize ??
            PAGINATION_DEFAULT_PAGE_SIZE;
    }
}
