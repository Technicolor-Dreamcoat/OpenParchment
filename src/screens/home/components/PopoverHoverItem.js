import React from "react";
import { Pressable } from "react-native";
import { useHover } from "../../../hooks/useHover";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";

const PopoverHoverItem = ({ children, onPress, style }) => {
  const { styles } = useThemedStyles();
  const { isHovered, props } = useHover();
  return (
    <Pressable
      {...props}
      onPress={onPress}
      style={[styles.popoverItem, style, isHovered && styles.popoverItemHover]}
    >
      {children}
    </Pressable>
  );
};

export default PopoverHoverItem;
