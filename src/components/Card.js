import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../theme";
import { useHover } from "../hooks/useHover";
import { triggerHaptic } from "../utils/haptics";

// component to present the articles/papers
export const Card = ({ children, style, onPress, accessibilityLabel }) => {
  const { common } = useTheme();
  const { props } = useHover();

  return (
    <Pressable
      {...props}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        if (onPress) {
          triggerHaptic("light");
          onPress();
        }
      }}
      style={[common.card, style]}
    >
      <View>{children}</View>
    </Pressable>
  );
};
