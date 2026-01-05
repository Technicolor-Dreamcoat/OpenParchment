import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";

// loading placeholders (used when loading articles/papers)
export const LoadingSkeleton = ({ isWideDesktop, isFirst }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width: "100%",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 18,
        },
        isWideDesktop ? { width: isFirst ? "99%" : "48%" } : { width: "100%" },
        { minHeight: 280 },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              backgroundColor: colors.generalHover,
              borderRadius: 8,
              width: 60,
              height: 24,
            }}
          />
          <View
            style={{
              backgroundColor: colors.generalHover,
              borderRadius: 8,
              width: 45,
              height: 24,
            }}
          />
        </View>
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: 28,
            height: 28,
          }}
        />
      </View>
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "90%",
            height: 22,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "60%",
            height: 22,
            marginBottom: 12,
          }}
        />
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "40%",
            height: 14,
          }}
        />
      </View>
      <View style={{ flex: 1, gap: 10, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "100%",
            height: 14,
          }}
        />
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "100%",
            height: 14,
          }}
        />
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: "95%",
            height: 14,
          }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: 110,
            height: 32,
          }}
        />
        <View
          style={{
            backgroundColor: colors.generalHover,
            borderRadius: 8,
            width: 80,
            height: 14,
          }}
        />
      </View>
    </View>
  );
};
