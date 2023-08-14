import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useOutlet,
} from "react-router-dom";

import { ColorScheme, ColorSchemeProvider } from "@mantine/core";

import { AnimatePresence, motion } from "framer-motion";

// basic window styles live here
import "./styles.css";
import App from "./App";

//hooks are generated from the procedures defined in the tauri bindings

const Providers = () => {
  const outlet = useOutlet();
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      {/* <Spotlight /> */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={useLocation().pathname}
          //change speed of animation
          transition={{ duration: 0.2 }}
          initial={{ y: "10%", opacity: 0 }}
          animate={{ y: "0", opacity: 1 }}
          exit={{ y: "-10%", opacity: 0 }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
    </ColorSchemeProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Providers />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/dashboard",
        element: <div>123</div>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
