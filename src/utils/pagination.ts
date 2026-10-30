import { Request } from "express";

export const getPagination = (query: Request["query"]) => {
  const page = Math.max(parseInt(String(query.page ?? "1")) || 1, 1);
  const limit = Math.max(parseInt(String(query.limit ?? "10")) || 10, 1);
  return { page, limit, skip: (page - 1) * limit };
};

export const buildMetadata = (page: number, limit: number, totalItems: number) => ({
  currentPage: page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
});