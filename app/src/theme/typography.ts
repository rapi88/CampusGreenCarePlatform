import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutralDark,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutralDark,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.neutralDark,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.neutralDark,
  },
  bodyMid: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.neutralMid,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.neutralMid,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutralMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.greenPrimary,
  },
});
