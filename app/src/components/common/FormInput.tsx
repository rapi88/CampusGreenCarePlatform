// Reusable styled text input
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export default function FormInput({
  label,
  error,
  isPassword,
  style,
  ...rest
}: FormInputProps) {
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          error ? styles.inputError : styles.inputNormal,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.neutralMid}
          secureTextEntry={secure}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecure((s) => !s)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{secure ? "🙈" : "🙊"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputNormal: { borderColor: Colors.neutralLight },
  inputError: { borderColor: Colors.error },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: Colors.neutralDark },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  error: { marginTop: 4, fontSize: 12, color: Colors.error },
});
