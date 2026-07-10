// Input — UI kit primitives (Edition 03).
// Field: labelled input, radius 16, volt focus ring, red error state.
// SearchInput: surface2 pill with a search icon.

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import SearchIcon from '../assets/icons/search.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Field({ label, error, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={WEROL_TOKENS.muted2}
        {...rest}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
          style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type SearchProps = TextInputProps;

export function SearchInput({ style, onFocus, onBlur, ...rest }: SearchProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <SearchIcon
        width={20}
        height={20}
        stroke={focused ? WEROL_TOKENS.lime : WEROL_TOKENS.muted2}
        strokeWidth={2.5}
        fill="none"
      />
      <TextInput
        placeholderTextColor={WEROL_TOKENS.muted2}
        {...rest}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[styles.searchInput, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 13,
    color: WEROL_TOKENS.muted,
    marginBottom: 10,
  },
  field: {
    backgroundColor: WEROL_TOKENS.surface2,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    borderRadius: RADII.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontFamily: FONTS.manropeMedium,
    fontSize: 16,
    color: WEROL_TOKENS.paper,
  },
  fieldFocused: { borderColor: WEROL_TOKENS.lime, borderWidth: 1.5 },
  fieldError: { borderColor: WEROL_TOKENS.danger, borderWidth: 1.5 },
  errorText: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 12,
    color: WEROL_TOKENS.danger,
    marginTop: 8,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.pill,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchFocused: { borderColor: WEROL_TOKENS.lime, backgroundColor: WEROL_TOKENS.surface2 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: FONTS.manropeMedium,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
  },
});
