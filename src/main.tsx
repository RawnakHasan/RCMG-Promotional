import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "@/pages/Home";
import Deck from "@/pages/Deck";
import Rules from "@/pages/Rules";
import Backs from "@/pages/Backs";
import ActionCardsRule from "@/pages/ActionCardsRule";
import WildCardsRule from "@/pages/WildCardsRule";
import Layout from "@/Layout";
import { ThemeProvider } from "@/providers/ThemeProvider";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/deck", element: <Deck /> },
      { path: "/actions", element: <ActionCardsRule /> },
      { path: "/wilds", element: <WildCardsRule /> },
      { path: "/rules", element: <Rules /> },
      { path: "/backs", element: <Backs /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system">
    <RouterProvider router={router} />
  </ThemeProvider>,
);
