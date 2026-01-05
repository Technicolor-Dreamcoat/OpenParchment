import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";

const PopoverContainer = ({ children, style }) => {
  const { styles } = useThemedStyles();
  const animation = useRef(new Animated.Value(0)).current;

  //popover animation
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  const animatedStyle = {
    opacity: animation,
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.popoverContainer, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default PopoverContainer;
