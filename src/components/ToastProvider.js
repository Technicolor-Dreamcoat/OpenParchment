import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ToastProvider as RNToastProvider,
  useToast as useRNToast,
} from "react-native-toast-notifications";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react-native";
import { useTheme } from "../theme";

// how long to show toast
const DEFAULT_DURATION = 4000;

// map toast types to the palette tokens & iconography
const getToastStyle = (type, colors) => {
  switch (type) {
    case "error":
      return {
        container: {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        text: colors.cardForeground || "red",
        muted: colors.mutedForeground,
        iconColor: colors.destructive || "red",
        IconComponent: AlertCircle,
      };
    case "success":
      return {
        container: {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        text: colors.cardForeground,
        muted: colors.mutedForeground,
        iconColor: "#16a34a",
        IconComponent: CheckCircle,
      };
    case "info":
    default:
      return {
        container: {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        text: colors.cardForeground,
        muted: colors.mutedForeground,
        iconColor: colors.primary,
        IconComponent: Info,
      };
  }
};

// internal toast renderer used by the provider
const CustomToast = ({ id, message, type, data, onClose, colors }) => {
  const styleConfig = getToastStyle(type, colors);
  const description = data?.description;
  const Icon = styleConfig.IconComponent;

  return (
    <View
      style={[
        styles.toast,
        {
          shadowColor: colors.shadow || "#000",
          backgroundColor: styleConfig.container.backgroundColor,
          borderColor: styleConfig.container.borderColor,
        },
      ]}
    >
      {/* icon section */}
      <View style={styles.iconContainer}>
        <Icon size={20} color={styleConfig.iconColor} />
      </View>

      {/* text content */}
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color: styleConfig.text }]}>
          {message}
        </Text>

        {description ? (
          <Text
            style={[styles.toastDescription, { color: styleConfig.muted }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {/* close button */}
      {onClose ? (
        <Pressable
          accessibilityLabel="Dismiss notification"
          hitSlop={12}
          onPress={() => onClose(id)}
          style={({ pressed }) => [
            styles.dismissButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <X size={16} color={styleConfig.muted} />
        </Pressable>
      ) : null}
    </View>
  );
};

export const ToastProvider = ({ children }) => {
  const { colors } = useTheme();

  // this allows colors to update without recreating the component tree
  const renderToast = useCallback(
    (toastOptions) => <CustomToast {...toastOptions} colors={colors} />,
    [colors]
  );

  return (
    <RNToastProvider
      placement="bottom"
      offsetTop={Platform.OS === "web" ? 24 : 60}
      offset={16} // offset from the top of the screen
      duration={DEFAULT_DURATION}
      animationType="slide-in"
      animationDuration={200}
      swipeEnabled={true}
      renderToast={renderToast}
    >
      {children}
    </RNToastProvider>
  );
};

export const useToast = () => {
  const toast = useRNToast();

  // a simplified API
  return useMemo(
    () => ({
      ...toast,
      success: (message, description) =>
        toast.show(message, { type: "success", data: { description } }),
      error: (message, description) =>
        toast.show(message, { type: "error", data: { description } }),
      info: (message, description) =>
        toast.show(message, { type: "info", data: { description } }),
      toast: (message, description) =>
        toast.show(message, { type: "info", data: { description } }),
    }),
    [toast]
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: Platform.OS === "web" ? "flex-end" : "center",
    marginRight: Platform.OS === "web" ? 24 : 0,
    width: Platform.OS === "web" ? "auto" : "92%",
    maxWidth: 420,
    minWidth: Platform.OS === "web" ? 356 : 0,
    marginBottom: 2,
    padding: 16,
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  iconContainer: {
    marginTop: 2,
  },
  toastContent: {
    flex: 1,
    gap: 4,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  toastDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginTop: 2,
    padding: 2,
  },
});
