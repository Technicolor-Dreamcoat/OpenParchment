import React from "react";
import { Image, Pressable } from "react-native";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";

export const FullLogo = () => {
  const { styles } = useThemedStyles();

  return (
    <Image
      source={require("../../../../assets/fullLogo.png")}
      style={styles.logoImage}
      resizeMode="contain"
    />
  );
};

export const SmallLogo = ({ onPress }) => {
  const { styles, theme } = useThemedStyles();
  const image = (
    <Image
      source={
        theme.colorScheme === "light"
          ? require("../../../../assets/smallLogoDark.png")
          : require("../../../../assets/smallLogo.png")
      }
      style={styles.logoImageSmall}
      resizeMode="contain"
    />
  );

  if (!onPress) return image;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      {image}
    </Pressable>
  );
};
