/**
 * The frame every form sits in: sign-in, sign-up and linking a child.
 *
 * Its job is keeping the field being typed in above the keyboard. The app is
 * drawn edge to edge (Android 15 insists, and Expo turns it on for every
 * version), so Android no longer shrinks the screen when the keyboard opens:
 * the keyboard covers the bottom of the form, and the form can't scroll far
 * enough to uncover it (docs/PROBLEMS-LOG.md, P-021).
 * KeyboardAvoidingView gives the room back as padding the height of the
 * keyboard, so the ScrollView gets shorter and Android scrolls the focused
 * field into view, the way it used to on its own.
 *
 * It sits inside SafeAreaView on purpose. Measured from there, the padding is
 * the keyboard alone, not the keyboard plus the navigation bar the safe area
 * already left room for.
 */
import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type FormScreenProps = {
  /** Sign-in and sign-up sit in the middle of the screen; linking a child starts at the top. */
  centered?: boolean;
  children: ReactNode;
};

export function FormScreen({ centered = false, children }: FormScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        testID="form-screen"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: theme.space.xl,
            justifyContent: centered ? "center" : "flex-start",
            padding: theme.space.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
