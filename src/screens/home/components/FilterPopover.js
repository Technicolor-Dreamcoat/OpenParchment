import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";
import { SORT_OPTIONS } from "../../../config/searchAndSortConfig";
import { triggerHaptic } from "../../../utils/haptics";
import PopoverHoverItem from "./PopoverHoverItem";
import PopoverContainer from "./PopoverContainer";

const FilterPopover = ({
  currentSortBy,
  currentSortOrder,
  onOptionSelect,
  onClose,
  alignLeft = false,
}) => {
  const { colors: COLORS, styles } = useThemedStyles();

  return (
    <View
      style={[
        styles.popoverWrapper,
        alignLeft
          ? { left: 0, right: undefined }
          : { right: 0, left: undefined },
      ]}
    >
      <Pressable style={styles.popoverBackdrop} onPress={onClose} />

      <PopoverContainer>
        <Text style={styles.popoverHeader}>Sort Papers By</Text>

        {SORT_OPTIONS.map((option) => {
          const isActive =
            currentSortBy === option.sortBy &&
            currentSortOrder === option.sortOrder;

          return (
            <PopoverHoverItem
              key={option.id}
              onPress={() => {
                triggerHaptic("selection");
                onOptionSelect(option);
                onClose();
              }}
            >
              <View style={{ width: 24, alignItems: "center" }}>
                {isActive && <Check size={14} color={COLORS.foreground} />}
              </View>
              <Text
                style={[
                  styles.popoverItemText,
                  isActive && styles.popoverItemTextActive,
                ]}
              >
                {option.label}
              </Text>
            </PopoverHoverItem>
          );
        })}
      </PopoverContainer>
    </View>
  );
};

export default FilterPopover;
