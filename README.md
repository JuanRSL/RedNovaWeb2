# RedNovaWeb2

Proyecto front-end Angular para la plataforma RedNova (versión 2).

## Descripción

Aplicación cliente construida con Angular que implementa funcionalidades de foros, posts y comentarios, con autenticación de usuarios, votaciones y paginación de contenidos. El código fuente principal está en la carpeta `rd/` (aplicación Angular).

## Características principales

- Registro e inicio de sesión de usuarios.
- Listado, creación y paginación de posts y foros.
- Comentarios y respuestas anidadas con votaciones (upvote/downvote).
- Gestión básica de permisos (autor, moderador, admin).
- Interceptores HTTP para manejar tokens y errores.

## Estructura del proyecto (resumen)

- [rd](rd): aplicación Angular.
	- [rd/package.json](rd/package.json): scripts y dependencias.
	- [rd/src/app](rd/src/app): código de la aplicación.
		- [rd/src/app/features](rd/src/app/features): módulos por característica (auth, post, comment, forum, subforum, user).
		- [rd/src/app/services](rd/src/app/services): servicios para API e autenticación.
		- [rd/src/app/models](rd/src/app/models): modelos TypeScript usados por la app.

## Requisitos

- Node.js (recomendado 18+)
- npm (la versión usada por el proyecto fue `npm@11.6.2`, pero cualquier versión moderna debería funcionar)
- Angular CLI (si desea ejecutar comandos `ng` globalmente)

## Instalación y ejecución (desarrollo)

1. Abrir una terminal en la carpeta `rd`:

```bash
cd rd
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar en modo desarrollo (con proxy configurado):

```bash
npm start
# Esto ejecuta: ng serve --proxy-config proxy.conf.json
```

El proxy (`proxy.conf.json`) redirige las llamadas a la API al backend durante el desarrollo.

## Compilar para producción

```bash
cd rd
npm run build
```

El resultado se ubicará en la carpeta `rd/dist/` según la configuración de Angular.

## Tests

```bash
cd rd
npm test
```

## Notas de implementación

- Se usan señales y `inject()` de Angular para manejo de estado y servicios.
- Los modelos TypeScript (por ejemplo `User`, `Comment`, `Subforum`) están en `rd/src/app/models`.
- El servicio de autenticación `AuthService` mantiene el usuario actual en una señal (`currentUser`) y guarda el token en `localStorage`.

## Contribuir

1. Hacer un fork y crear una rama por feature/bugfix.
2. Abrir un pull request con una descripción clara de los cambios.

## Licencia

Añadir información de licencia aquí si aplica.

--
