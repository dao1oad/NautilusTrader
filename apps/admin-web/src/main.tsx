import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import "@radix-ui/themes/layout/tokens.css";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

void import("@radix-ui/themes/components/theme")
  .then(({ Theme }) => {
    root.render(
      <React.StrictMode>
        <Theme accentColor="amber" appearance="dark" grayColor="slate" panelBackground="solid" radius="medium" scaling="95%">
          <App />
        </Theme>
      </React.StrictMode>
    );
  })
  .catch(() => {
    root.render(app);
  });
