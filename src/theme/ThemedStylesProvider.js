import React, { useContext, useMemo } from "react";
import { useTheme } from ".";
import createStyles from "./styles";

const ThemedStylesContext = React.createContext(null);

const useThemedStyles = () => {
  const context = useContext(ThemedStylesContext);

  if (!context) {
    throw new Error("useThemedStyles must be used within ThemedStylesProvider");
  }

  return context;
};

const ThemedStylesProvider = ({ children }) => {
  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const value = useMemo(
    () => ({
      theme,
      colors: theme.colors,
      styles,
    }),
    [theme, styles]
  );

  return (
    <ThemedStylesContext.Provider value={value}>
      {children}
    </ThemedStylesContext.Provider>
  );
};

export { ThemedStylesProvider, useThemedStyles };
