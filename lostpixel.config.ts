import type { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [
      { path: "/layouts/books/fiction", name: "fiction-books" },
      { path: "/layouts/books/biography", name: "biography-pages" },
    ],
    baseUrl: "http://localhost:3001",
  },
  generateOnly: true,
};
