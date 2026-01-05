import React from "react";
import { Text, View } from "react-native";
import { useThemedStyles } from "../theme/ThemedStylesProvider";

// badge indicator component
const Badge = ({ children, variant = "default" }) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";
  let bg = COLORS.primary;
  let text = COLORS.primaryForeground;
  let border = "transparent";

  // determine palette based on the requested style
  if (isOutline) {
    bg = "transparent";
    text = COLORS.foreground;
    border = COLORS.border;
  } else if (isSecondary) {
    bg = COLORS.sidebarActive;
    text = COLORS.secondaryForeground;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color: text }]}>{children}</Text>
    </View>
  );
};

export { Badge };
