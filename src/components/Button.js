import React from "react";
import { Pressable, Text, Platform } from "react-native";
import { useTheme } from "../theme";
import { useHover } from "../hooks/useHover";
import { triggerHaptic } from "../utils/haptics";

// map specific palettes to Button variants
const getVariantStyles = (colors, variant) => {
  const styles = {
    default: {
      backgroundColor: colors.primary,
      foregroundColor: colors.primaryForeground,
      borderColor: colors.primary,
      hoverBackgroundColor: colors.primaryHover,
      pressedBackgroundColor: colors.primaryHover,
    },
    secondary: {
      backgroundColor: colors.secondary,
      foregroundColor: colors.secondaryForeground,
      borderColor: colors.secondary,
      hoverBackgroundColor: colors.sidebarActive,
      pressedBackgroundColor: colors.sidebarActive,
    },
    destructive: {
      backgroundColor: colors.background,
      foregroundColor: colors.destructive,
      borderColor: "transparent",
      hoverBackgroundColor: colors.destructiveHover,
      pressedBackgroundColor: colors.destructiveHover,
    },
    clearOutline: {
      backgroundColor: "transparent",
      foregroundColor: colors.foreground,
      borderColor: colors.border,
      hoverBackgroundColor: colors.generalHover,
      pressedBackgroundColor: colors.generalHover,
    },
    outline: {
      backgroundColor: colors.background,
      foregroundColor: colors.foreground,
      borderColor: colors.border,
      hoverBackgroundColor: colors.generalHover,
      pressedBackgroundColor: colors.generalHover,
    },
    ghost: {
      backgroundColor: "transparent",
      foregroundColor: colors.foreground,
      borderColor: "transparent",
      hoverBackgroundColor: colors.generalHover,
      pressedBackgroundColor: colors.generalHover,
    },
    link: {
      backgroundColor: "transparent",
      foregroundColor: colors.primary,
      borderColor: "transparent",
      hoverBackgroundColor: "transparent",
      pressedBackgroundColor: "transparent",
      hoverForegroundColor: colors.primaryHover,
    },
  };

  return styles[variant] || styles.default;
};

// sizing presets
const sizeStyles = {
  sm: { height: 36, paddingHorizontal: 12, borderRadius: 6 },
  default: { height: 40, paddingHorizontal: 16, borderRadius: 6 },
  md: { height: 40, paddingHorizontal: 16, borderRadius: 6 },
  lg: { height: 44, paddingHorizontal: 32, borderRadius: 6 },
  icon: { height: 40, width: 40, paddingHorizontal: 0, borderRadius: 100 },
};

export const Button = ({
  children,
  variant = "default",
  size = "default",
  Icon,
  style,
  textStyle,
  onPress,
  disabled,
  ...props
}) => {
  const { colors, typography } = useTheme();
  const { isHovered, props: hoverProps } = useHover();
  const [isPressed, setIsPressed] = React.useState(false);

  const variantAliases = {
    primary: "default",
  };

  // translate alias into a concrete variant & lookup style tokens
  const resolvedVariant = variantAliases[variant] || variant;
  const currentVariant = getVariantStyles(colors, resolvedVariant);
  const currentSize = sizeStyles[size] || sizeStyles.default;

  // determine colors based on state
  const getBackgroundColor = (pressed) => {
    if (disabled) return colors.muted;

    if (resolvedVariant === "ghost" || resolvedVariant === "link") {
      if (pressed || isHovered) return currentVariant.hoverBackgroundColor;
      return "transparent";
    }

    if (resolvedVariant === "outline" || resolvedVariant === "clearOutline") {
      if (pressed || isHovered) return currentVariant.hoverBackgroundColor;
      return currentVariant.backgroundColor;
    }

    // for solid colors
    if (pressed || isHovered) return currentVariant.hoverBackgroundColor;
    return currentVariant.backgroundColor;
  };

  const getBorderColor = () => {
    if (resolvedVariant === "outline" && !disabled)
      return currentVariant.borderColor;
    if (resolvedVariant === "clearOutline" && !disabled)
      return currentVariant.borderColor;
    if (resolvedVariant === "secondary" && !disabled)
      return currentVariant.borderColor;
    if (resolvedVariant === "destructive" && !disabled)
      return currentVariant.borderColor;
    return "transparent";
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedForeground;
    if (resolvedVariant === "link" && (isHovered || isPressed)) {
      return (
        currentVariant.hoverForegroundColor || currentVariant.foregroundColor
      );
    }
    return currentVariant.foregroundColor;
  };

  const getOpacity = (pressed) => {
    if (disabled) return 0.5;
    if (pressed && resolvedVariant === "destructive") return 0.9;
    return 1;
  };

  // toggle underline for links
  const getTextDecoration = (pressed) => {
    if (resolvedVariant !== "link") return "none";
    if (pressed || isHovered) return "underline";
    return "none";
  };

  return (
    <Pressable
      {...hoverProps}
      {...props}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={(e) => {
        if (!disabled) {
          triggerHaptic("light");
          onPress && onPress(e);
        }
      }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth:
            resolvedVariant === "outline" || resolvedVariant === "clearOutline"
              ? 1
              : 0,
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(pressed),
          opacity: getOpacity(pressed),
          gap: 8,
          ...Platform.select({
            web: {
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            },
          }),
        },
        currentSize,
        style,
      ]}
    >
      {Icon && (
        <Icon
          size={size === "sm" ? 16 : 18}
          color={getTextColor()}
          strokeWidth={2.5}
        />
      )}

      {children ? (
        <Text
          style={[
            {
              fontSize: 14,
              fontWeight: "500",
              color: getTextColor(),
              lineHeight: 20,
              textDecorationLine: getTextDecoration(isPressed),
            },
            typography?.sm && { fontSize: typography.sm }, // fallback to theme if it exists
            textStyle,
          ]}
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : null}
    </Pressable>
  );
};
