import { useState } from "react";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const props = isWeb
    ? {
        onHoverIn: () => setIsHovered(true),
        onHoverOut: () => setIsHovered(false),
      }
    : {};

  return { isHovered, props };
};
