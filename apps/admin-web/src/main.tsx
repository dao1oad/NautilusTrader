import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@radix-ui/themes";

import { App } from "./app";
import "@radix-ui/themes/tokens/base.css";
import "./styles.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme accentColor="amber" appearance="dark" grayColor="slate" panelBackground="solid" radius="medium" scaling="95%">
      <App />
    </Theme>
  </React.StrictMode>
);
