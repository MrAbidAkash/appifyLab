// src/lib/services/userApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface User {
  _id: string;
  email: string;
  name?: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }), // base URL points to your Next API
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "users", // /api/users GET
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: "users",
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: "login",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation, useLoginMutation } =
  userApi;
