import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';

type Mode = 'login' | 'register';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const login = useUserStore((s) => s.login);
  const register = useUserStore((s) => s.register);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = name.trim().length >= 2;
  const passwordValid = password.length >= 4;
  const passwordMatch = password === passwordConfirm;

  const canSubmit = isRegister
    ? nameValid && emailValid && passwordValid && passwordMatch
    : emailValid && passwordValid;

  const handleSubmit = () => {
    setError(null);
    if (isRegister) {
      if (!nameValid) return setError(t('register.error.name'));
      if (!emailValid) return setError(t('register.error.email'));
      if (!passwordValid) return setError(t('register.error.password'));
      if (!passwordMatch) return setError(t('register.error.passwordMatch'));
      register(email.trim(), name.trim());
      return;
    }
    if (!emailValid || !passwordValid) return;
    login(email.trim());
  };

  const handleGuest = () => login('guest@werol.app');

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setPassword('');
    setPasswordConfirm('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Text style={TEXT_STYLES.wordmark}>WER</Text>
          <Text style={TEXT_STYLES.wordmarkAccent}>O</Text>
          <Text style={TEXT_STYLES.wordmark}>L</Text>
        </View>

        <View style={styles.headWrap}>
          <Text style={styles.heading}>
            {isRegister ? t('register.title') : t('login.title')}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister ? t('register.subtitle') : t('login.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <View style={styles.field}>
              <Ionicons name="person-outline" size={18} color={COLORS.cream3} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('register.name')}
                placeholderTextColor={COLORS.dim}
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.field}>
            <Ionicons name="mail-outline" size={18} color={COLORS.cream3} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.email')}
              placeholderTextColor={COLORS.dim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.cream3} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.password')}
              placeholderTextColor={COLORS.dim}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {isRegister && (
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.cream3} />
              <TextInput
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder={t('register.passwordConfirm')}
                placeholderTextColor={COLORS.dim}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color={COLORS.likeRed} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.cta,
              !canSubmit && styles.ctaDisabled,
              pressed && canSubmit && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.ctaText}>
              {isRegister ? t('register.cta') : t('login.cta')}
            </Text>
          </Pressable>

          {!isRegister && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('login.or')}</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                onPress={handleGuest}
                style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="person-outline" size={18} color={COLORS.cream} />
                <Text style={styles.guestText}>{t('login.guest')}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isRegister ? t('register.haveAccount') : t('login.noAccount')}
          </Text>
          <Pressable onPress={toggleMode} hitSlop={8}>
            <Text style={styles.switchLink}>
              {isRegister ? t('register.toLogin') : t('login.toRegister')}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>{t('login.terms')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ink },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.section,
  },
  brand: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.hero,
  },
  headWrap: { gap: SPACING.sm, marginBottom: SPACING.hero },
  heading: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 14,
    color: COLORS.cream3,
    lineHeight: 20,
  },
  form: { gap: SPACING.lg },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: COLORS.cream,
    fontFamily: FONTS.dmSansRegular,
    fontSize: 14,
    padding: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.likeRed}1a`,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: `${COLORS.likeRed}55`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 12,
    color: COLORS.likeRed,
  },
  cta: {
    backgroundColor: COLORS.teal,
    borderRadius: RADII.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 15,
    color: COLORS.ink,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.ink3 },
  dividerText: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 10,
    color: COLORS.cream3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: 'transparent',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    paddingVertical: 14,
  },
  guestText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 14,
    color: COLORS.cream,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.hero,
  },
  switchText: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 13,
    color: COLORS.cream3,
  },
  switchLink: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 13,
    color: COLORS.teal,
  },
  footer: {
    marginTop: SPACING.lg,
    fontFamily: FONTS.dmSansRegular,
    fontSize: 11,
    color: COLORS.dim,
    textAlign: 'center',
    lineHeight: 16,
  },
});
