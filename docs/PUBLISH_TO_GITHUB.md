# Cómo publicar este repositorio en GitHub

**Antes de publicarlo:** verificá que la empresa autorice la descripción pública de tu trabajo. Este ZIP contiene únicamente una demostración creada con información ficticia.

## Método más sencillo (desde el navegador)

1. Iniciá sesión en GitHub y seleccioná **New repository**.
2. Nombre sugerido: `inventory-automation-power-automate`.
3. Escribí una descripción breve: `ERP inventory reporting automation | Power Automate, Office Scripts and Excel`.
4. Elegí **Private** hasta confirmar los permisos de difusión; después podrás cambiarlo a **Public** si corresponde.
5. No inicialices con README, `.gitignore` ni licencia (ya están incluidos en el ZIP).
6. Creá el repositorio.
7. Descomprimí el ZIP en tu computadora. En el nuevo repositorio, elegí **Add file → Upload files** y arrastrá el **contenido interno** de `inventory-automation-portfolio`, no la carpeta ZIP.
8. Confirmá los cambios. Comprobá que `README.md` se vea en la portada, aparezca `assets/demo-preview.png` y que las pruebas de GitHub Actions pasen.

**Atención:** la interfaz web de GitHub puede tener límites para subir carpetas enteras. Si no te permite arrastrar el contenido, usá GitHub Desktop o el método por consola que figura debajo.

## Método por consola (opcional)

Luego de crear el repositorio vacío y descomprimir el proyecto:

```bash
cd inventory-automation-portfolio
git init
git add .
git commit -m "Add public inventory automation portfolio demo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/inventory-automation-power-automate.git
git push -u origin main
```

Reemplazá `TU_USUARIO` por tu nombre de usuario de GitHub y usá los mecanismos de autenticación de GitHub; nunca pegues tokens en el repositorio.

## Ponerlo en el CV

Agregá el enlace al repositorio bajo el título **Inventory Reporting Automation | Microsoft Power Automate** en el apartado **Projects**. El texto propuesto para el CV está en `docs/CV_AND_LINKEDIN.md`.

**No afirmes que el proyecto de cotizaciones con IA o el dashboard gerencial están implementados:** son iniciativas que podrían desarrollarse a futuro.
