import React, { useState } from "react";
import { TextInput, Text, View, Platform, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export const FormInput = ({
  label,
  error,
  description,
  style,
  inputStyle,
  className,
  onFocus,
  onBlur,
  disabled,
  ...rest
}) => {
  const { colors, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const getBorderColor = () => {
    if (error) return colors.destructive;
    if (isFocused) return colors.primary;
    return colors.border;
  };
  const ringColor = error ? colors.destructive : colors.generalHover;
  const focusRingStyle =
    Platform.OS === "web" && isFocused
      ? {
          boxShadow: `0 0 0 2px ${colors.background}, 0 0 0 4px ${ringColor}`,
        }
      : null;

  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label && (
        <Text
          style={{
            color: error ? colors.destructive : colors.foreground,
            fontSize: typography.sm,
            fontWeight: "500",
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}

      <TextInput
        placeholderTextColor={colors.mutedForeground}
        editable={!disabled}
        className={className}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor: getBorderColor(),
            shadowOpacity: isFocused ? 0.15 : 0,
            opacity: disabled ? 0.5 : 1,
            color: colors.foreground,
            backgroundColor: colors.card,
          },
          focusRingStyle,
          rest.multiline && styles.multiline,
          inputStyle,
        ]}
        {...rest}
      />

      {/* helper description */}
      {description && !error && (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            marginTop: spacing.xs,
          }}
        >
          {description}
        </Text>
      )}

      {/* error message */}
      {error && (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 12,
            fontWeight: "500",
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({
      web: {
        outlineStyle: "none",
        cursor: "text",
        transitionProperty: "box-shadow, border-color",
        transitionDuration: "150ms",
      },
    }),
  },
  multiline: {
    height: undefined,
    minHeight: 80,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
});
