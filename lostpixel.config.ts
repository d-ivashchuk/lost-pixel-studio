import type { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [
      // { path: "/layouts/books/fiction", name: "fiction-books" },
      { path: "/layouts/books/biography", name: "biography-pages" },
      { path: "/layouts/books/education", name: "education-pages" },
      { path: "route-groups/education", name: "clothing" },
      { path: "layouts/electronics", name: "nested" },
      { path: "layouts/electronics", name: "x" },
      { path: "layouts/electronics", name: "y" },
    ],
    baseUrl: "http://localhost:3000",
  },
  generateOnly: true,
  compareEngine: "odiff",
};
