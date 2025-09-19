import "flatpickr/dist/flatpickr.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "swiper/swiper-bundle.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

import { ApolloProvider } from "@apollo/client/react"; // ✅ v4 path
import { apolloClient } from "./core/apollo/client";        // ✅ your client

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <ApolloProvider client={apolloClient}>
          <App />
        </ApolloProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
);
