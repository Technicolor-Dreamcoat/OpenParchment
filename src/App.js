import React from "react";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./state/AuthProvider";
import { ThemeProvider } from "./theme";
import { ToastProvider } from "./components";
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
