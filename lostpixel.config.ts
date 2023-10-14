import type { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  storybookShots: {
    storybookUrl: "./storybook-static",
  },

  // pageShots: {
  //   pages: [
  //     // { path: "/layouts/books/fiction", name: "fiction-books" },
  //     { path: "/layouts/books/biography", name: "biography-pages" },
  //     { path: "/layouts/books/education", name: "education-pages" },
  //     { path: "route-groups/biography", name: "clothing" },
  //     { path: "layouts/education", name: "nested" },
  //     { path: "layouts/biography", name: "t" },
  //     { path: "layouts/electronics", name: "m" },
  //     { path: "layouts/biography", name: "l" },
  //   ],
  //   baseUrl: "http://localhost:3000",
  // },
  generateOnly: true,
  compareEngine: "odiff",
};
