import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TREE_SPECIES_OPTIONS } from '../../constants/treeSpecies';
import { Colors } from '../../theme/colors';
import { Radius, Shadow, Spacing } from '../../theme/spacing';

interface TreeSpeciesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function TreeSpeciesDropdown({
  value,
  onChange,
  error,
}: TreeSpeciesDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = TREE_SPECIES_OPTIONS.find((option) => option.value === value);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tür *</Text>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen((current) => !current)}
        activeOpacity={0.85}
      >
        <View style={styles.triggerTextWrap}>
          <Text
            style={[
              styles.triggerLabel,
              !selected && styles.triggerPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : 'Ağaç türü seçin'}
          </Text>
          {selected ? (
            <Text style={styles.triggerValue} numberOfLines={1}>
              {selected.value}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.menu}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            style={styles.menuScroll}
          >
            {TREE_SPECIES_OPTIONS.map((option) => {
              const optionSelected = option.value === value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    optionSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={styles.optionTextWrap}>
                    <Text
                      style={[
                        styles.optionLabel,
                        optionSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionValue,
                        optionSelected && styles.optionValueSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {option.value}
                    </Text>
                  </View>
                  {optionSelected ? (
                    <Text style={styles.check}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  trigger: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  triggerError: {
    borderColor: Colors.error,
  },
  triggerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutralDark,
  },
  triggerPlaceholder: {
    color: Colors.neutralMid,
    fontWeight: '500',
  },
  triggerValue: {
    fontSize: 12,
    color: Colors.greenPrimary,
    marginTop: 2,
    fontWeight: '600',
  },
  chevron: {
    width: 24,
    textAlign: 'center',
    fontSize: 20,
    color: Colors.neutralMid,
    fontWeight: '700',
  },
  menu: {
    marginTop: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.card,
  },
  menuScroll: {
    maxHeight: 240,
  },
  option: {
    minHeight: 58,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
    gap: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.greenLight,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.neutralDark,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: Colors.greenDark,
  },
  optionValue: {
    fontSize: 12,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  optionValueSelected: {
    color: Colors.greenPrimary,
    fontWeight: '600',
  },
  check: {
    width: 22,
    textAlign: 'center',
    color: Colors.greenPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
});
