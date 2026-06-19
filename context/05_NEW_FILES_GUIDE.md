# 05 · Guía para crear archivos nuevos

## Árbol de decisión rápido

| Quiero… | Creo / edito |
|---------|--------------|
| Una pantalla nueva | archivo `.tsx` dentro de `app/` (la ruta = el path) |
| Una pantalla dentro de auth/tabs | en `app/(auth)/` o `app/(tabs)/` + registrarla en su `_layout.tsx` |
| Una ruta dinámica | `app/<seccion>/[param]/index.tsx` |
| Consumir un endpoint | método en `src/services/<dominio>Service.ts` (o servicio nuevo) |
| Un tipo nuevo | en `src/types/<dominio>.ts` + export en `src/types/index.ts` |
| Color/spacing nuevo | `src/constants/theme.ts` |
| Util compartida | `src/utils/` |

## Crear una pantalla

1. Crear `app/<ruta>.tsx` (o dentro de un grupo). Ejemplo `app/(tabs)/ayuda.tsx`:
   ```tsx
   import React from "react";
   import { View, Text, StyleSheet } from "react-native";
   import { SafeAreaView } from "react-native-safe-area-context";
   import { Colors, Spacing } from "../../src/constants/theme";

   export default function AyudaScreen() {
     return (
       <SafeAreaView style={styles.container}>
         <Text style={styles.title}>Ayuda</Text>
       </SafeAreaView>
     );
   }

   const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
     title: { color: Colors.text, fontSize: 20, fontWeight: "600" },
   });
   ```
2. Si va en `(tabs)` o `(auth)`, **agregá el `<...Trigger/Screen name="ayuda" />`** en el `_layout.tsx` del grupo (si corresponde; en Stack a veces basta con el archivo).
3. Navegá con `router.push("/ayuda")`.

## Crear/usar un servicio

1. En `src/services/<dominio>Service.ts`:
   ```ts
   import api from "./api";
   import { MiTipo } from "../types";

   export const miService = {
     async getAlgo(): Promise<MiTipo[]> {
       const res = await api.get("/ruta");        // ruta real del backend (verificar en Swagger)
       return Array.isArray(res.data) ? res.data : [];
     },
   };
   ```
2. Export en `src/services/index.ts`: `export { miService } from "./miService";`
3. Tipá request/response con `src/types/`. Si la respuesta mezcla camel/snake, agregá un `normalizeXxx`.

## Crear un tipo

1. En `src/types/<dominio>.ts` (o el existente), reflejando el Swagger:
   ```ts
   export interface MiTipo { id: number; nombre: string; }
   ```
2. Asegurate de que `src/types/index.ts` lo re-exporte (`export * from './<dominio>'`).

## Archivos que suelen cambiar JUNTOS

| Cambio | Tocás |
|--------|-------|
| Nuevo endpoint consumido | `src/types/*` + `src/services/*Service.ts` + `src/services/index.ts` + la pantalla |
| Nueva pantalla con datos | `app/<ruta>.tsx` + (`_layout.tsx` del grupo) + servicio + tipos |
| Nuevo campo de un modelo | `src/types/*` + el `normalizeXxx` del servicio + la UI que lo muestra |
| Cambio de navegación | el `_layout.tsx` correspondiente |

## Patrones a copiar

| Caso | Copiá de |
|------|----------|
| Listado con fetch + refresh | `app/(tabs)/subastas.tsx` o `index.tsx` |
| Pantalla con formulario + Alert | `app/(auth)/login.tsx` |
| Multipart con image-picker | `app/(auth)/register-step1.tsx` o `app/consignar.tsx` |
| Detalle por ruta dinámica | `app/subasta/[id]/index.tsx` |
| Servicio con normalizer | `src/services/userService.ts` |
| Servicio multipart (RN + web) | `src/services/articleService.ts` |
