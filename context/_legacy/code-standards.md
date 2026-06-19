# Code Standards

## React Native / Expo

- Usar Functional Components y Hooks.
- Tipado estricto con TypeScript para todas las interfaces que coincidan con los esquemas de Swagger (ej. `Usuario`, `ItemCatalogo`, `Puja`).
- Gestión de estado global mínima; preferir React Query o SWR para consumir el backend FastAPI y manejar la caché de catálogos.
- usar NativeWind para estilos, evitando el uso de hojas de estilo tradicionales. Se deben seguir las convenciones de Tailwind CSS para mantener la consistencia visual.

## FastAPI

- Cumplimiento estricto de tipado con Pydantic models (reflejando el Swagger YAML).
- Inyección de dependencias (`Depends`) para validar el token JWT y la categoría del usuario en endpoints protegidos.
- Manejo explícito de errores HTTP (400, 401, 403, 404, 409) documentados[cite: 84].

## Estructura de Repositorio

- `/frontend-da1`: Código React Native.
- `/backend-da1`: Endpoints, modelos, servicios FastAPI.
- `/context`: Documentación SDD, specs, swagger y .md con la consigna (documento fundamental que inidca los requisitos del proyecto a realizar).
