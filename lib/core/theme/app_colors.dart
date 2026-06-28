import 'package:flutter/material.dart';

abstract class AppColors {
  // Fjord green — primary (70%)
  static const primary      = Color(0xFF1B4D35);
  static const primaryDark  = Color(0xFF0F2E1E);
  static const primaryMid   = Color(0xFF2A6B4A);
  static const primaryLight = Color(0xFFEBF5EF);
  static const action       = Color(0xFF1F7A49);

  // Norwegian flag red — accent (10%)
  static const flagRed      = Color(0xFFA8291F);
  static const flagRedLight = Color(0xFFFDECEA);

  // Fjord blue — navigation/water (20%)
  static const fjordBlue    = Color(0xFF1A3F6F);
  static const fjordBlueLt  = Color(0xFFDDE8F5);

  // Amber — ratings only
  static const amber        = Color(0xFFD4931A);

  // Surfaces — warm paper
  static const background   = Color(0xFFF2F0EC);
  static const card         = Color(0xFFFDFCFA);
  static const border       = Color(0xFFDDE5DF);

  // Text
  static const textPrimary  = Color(0xFF111A14);
  static const textSecond   = Color(0xFF3D5244);
  static const textThird    = Color(0xFF7A9280);
}
