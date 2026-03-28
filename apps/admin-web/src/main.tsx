import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@radix-ui/themes/components/theme";

import { App } from "./app";
import { I18nProvider } from "./shared/i18n/i18n-provider";
import "@radix-ui/themes/layout/tokens.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <Theme accentColor="amber" appearance="dark" grayColor="slate" panelBackground="solid" radius="medium" scaling="95%">
        <App />
      </Theme>
    </I18nProvider>
  </React.StrictMode>
);
