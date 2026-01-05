import { useColorScheme } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { darkColors, lightColors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";
import { createCommonStyles } from "./commonStyles";

const ThemeContext = createContext(null);

export const getTheme = (scheme = "dark") => {
  const colors = scheme === "light" ? lightColors : darkColors;

  return {
    colorScheme: scheme,
    colors,
    spacing,
    typography,
    common: createCommonStyles(colors, spacing),
  };
};

export const ThemeProvider = ({ children, initialScheme }) => {
  const systemScheme = useColorScheme();
  const [scheme, setScheme] = useState(initialScheme || systemScheme || "dark");

  useEffect(() => {
    if (!initialScheme && systemScheme && systemScheme !== scheme) {
      setScheme(systemScheme);
    }
  }, [initialScheme, scheme, systemScheme]);

  const theme = useMemo(() => getTheme(scheme), [scheme]);

  const value = useMemo(
    () => ({
      theme,
      colorScheme: scheme,
      setColorScheme: setScheme,
    }),
    [scheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  const fallbackScheme = useColorScheme?.() || "dark";

  if (context) {
    return context.theme;
  }

  return useMemo(() => getTheme(fallbackScheme), [fallbackScheme]);
};

export const useThemeController = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeController must be used within ThemeProvider");
  }

  return context;
};

export { darkColors, lightColors, spacing, typography };
