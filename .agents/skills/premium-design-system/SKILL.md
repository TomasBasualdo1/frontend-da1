---
name: premium-design-system
description: Guidelines and design system rules for creating a premium cream/gold visual aesthetic in the React Native / Expo application, avoiding common style intercept bugs with NativeWind.
---

# Premium Cream & Gold Design System Guide

Use these guidelines to build and maintain a top-tier, luxury-grade user interface for the auction app. Follow these rules for all new screen implementations and refactors.

## 1. Color Palette & Typography

- **Backgrounds**: Always use `#FFF8F0` (Soft cream) as the primary screen background. Avoid stark white screens.
- **Surfaces & Cards**: Use `#FFFFFF` (Pure white) for containers, cards, and list elements.
- **Primary Text & Dark Accents**: Use `#1A1A2E` (Elegant dark navy) for main headings, body text, and prominent buttons.
- **Secondary/Muted Text**: Use `#6B7280` (Medium gray) and `#9CA3AF` (Light gray) for secondary metadata.
- **Golden Branding Tones**:
  - `#8B6914` (Main dark gold)
  - `#B8941C` (Medium gold)
  - `#6B4F10` (Deep shadow gold)
- **Borders & Dividers**: Use `#E5DDD0` (Warm border) or `#F0EBE3` (Very subtle border) to separate containers.

## 2. Layout & Spacing Rules

- **Page Margins**: Standard horizontal margins must be exactly `24px` to give components room to breathe.
- **Borders & Radii**:
  - Large containers (cards, hero covers): `20px` border radius.
  - Medium elements (cards, thumbnails): `14px` or `18px` border radius.
  - Small buttons or chips: `8px` or `10px` border radius.
- **Card Shadows**: Apply subtle golden-tinted shadows for depth:
  ```typescript
  const SHADOW = Platform.select({
    ios: {
      shadowColor: "rgba(139,105,20,0.12)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  });
  ```

## 3. High-Quality UI Patterns

- **Pulsating Live Dot**: Use an animated, pulsating red dot indicator for live state signals.
- **Gradient Overlays**: Always place a `<LinearGradient>` (`['transparent', 'rgba(0,0,0,0.7)']`) on top of hero/cover images to guarantee typography contrast and readability.
- **Chips & Badges**: Standardize category chips with small background tints, matching colored borders, and a matching MaterialIcon (e.g. `emoji-events` for gold/oro).

## 4. Critical NativeWind Bug Prevention

When compiling NativeWind with React Native components:

- **Do NOT** style `<Pressable>` or `<TouchableOpacity>` directly with layout styles (`flexDirection: "row"`, `padding`, `backgroundColor`, `borderRadius`, `marginHorizontal`, `shadows`). NativeWind v4 intercepts touch responders and strips standard stylesheet rules.
- **Always** wrap the touchable contents in a styled `<View>` element to carry all card layout, border, background, and shadow properties:
  ```tsx
  <Pressable onPress={handlePress}>
    <View style={st.card}>
      <Image style={st.thumb} />
      <View style={st.content}>...</View>
    </View>
  </Pressable>
  ```
