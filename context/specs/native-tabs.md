# Spec 11: Native Tabs (Expo SDK 54)

## Objetivo

Reemplazar las tabs actuales de expo-router por Native Tabs para el layout de app/(tabs)/_layout.tsx, manteniendo las rutas y etiquetas existentes.

## Alcance

- Solo frontend.
- SDK 54: usar Native Tabs desde expo-router/unstable-native-tabs.
- Rutas: index, live, subastas, profile.
- Iconos: sf (iOS) y androidSrc con VectorIcon (Android).

## Tareas Frontend (React Native)

1. Reemplazar el componente Tabs por NativeTabs.
2. Actualizar cada tab a NativeTabs.Trigger con Label e Icon.
3. Mantener los titulos en espanol: Inicio, En Vivo, Subastas, Perfil.
4. Remover estilos especificos del TabBar que ya no aplican en Native Tabs.

## Criterios de Aceptacion

- El layout de tabs usa Native Tabs con las cuatro rutas actuales.
- Los labels se muestran correctamente en iOS y Android.
- Los iconos se renderizan en iOS (sf) y Android (VectorIcon).
