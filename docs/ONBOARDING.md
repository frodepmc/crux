# Welcome to CRUX Consulting

## How We Use Claude

Based on frodepmc's usage over the last 30 days:

Work Type Breakdown:
  Build Feature   ████████████████░░░░  80%
  Plan Design     ██░░░░░░░░░░░░░░░░░░  10%
  Write Docs      ██░░░░░░░░░░░░░░░░░░  10%

Top Skills & Commands:
  /frontend-design  ████████████████░░░░  4x/month
  /context          ████████░░░░░░░░░░░░  2x/month
  /model            ████░░░░░░░░░░░░░░░░  1x/month

Top MCP Servers:
  Claude_Preview      ████████████████████  318 calls
  Claude_in_Chrome    ███░░░░░░░░░░░░░░░░░  53 calls

## Your Setup Checklist

### Codebases
- [ ] **crux** — https://github.com/frodepmc/crux — Landing y página de servicios de CRUX Consulting (HTML/CSS/JS estático, desplegado en Vercel)

### MCP Servers to Activate
- [ ] **Claude_Preview** — Preview server integrado para verificar cambios en vivo sin salir de Claude Code. Arranca un servidor HTTP local (Python) y permite evaluar JS, tomar screenshots, inspeccionar elementos y redimensionar viewports. Configurado via `.claude/launch.json`. No requiere acceso especial.
- [ ] **Claude_in_Chrome** — Control del navegador Chrome real para testing visual, navegación, screenshots y debugging. Requiere la extensión Claude in Chrome instalada en el navegador.

### Skills to Know About
- `/frontend-design` — Genera interfaces frontend con calidad de diseño premium. Lo usamos cuando queremos que un componente sea visualmente memorable, no genérico. Activa un modo de pensamiento de diseño (tipografía, color, motion, composición) antes de codificar.
- `/context` — Muestra el uso de contexto actual (tokens consumidos, MCP tools, skills cargados). Útil para saber cuánto contexto queda en sesiones largas.
- `/model` — Cambia el modelo en uso (e.g., `claude-opus-4-6[1m]` para contexto de 1M tokens). Lo usamos en sesiones largas de implementación monolítica.

## Team Tips

1. **Siempre Opus con 1M de contexto.** Usamos `/model claude-opus-4-6[1m]` al empezar sesiones largas. El contexto extra permite implementaciones monolíticas sin perder hilo.

2. **Implementación monolítica, sin checkpoints.** Preferimos hacer todas las fases de un tirón y validar al final, en vez de parar entre cada paso. Maximiza el uso del contexto.

3. **Commits en español con detalle técnico.** Los mensajes de commit se escriben en español, con cuerpo detallado que explique el qué y el por qué. Siempre `git add` de archivos específicos, nunca `git add -A`.

4. **"c&m" = commit + push.** Cuando decimos "c&m" o "commit + push", Claude hace staging + commit con mensaje descriptivo + push en un solo paso.

5. **Pide opciones antes de implementar decisiones estratégicas.** En cosas que afectan al posicionamiento, pricing o estructura del negocio, presenta 2-3 opciones y deja que el equipo decida. En cosas técnicas o de UI, ejecuta directamente.

6. **Plan mode para tareas complejas.** Para features grandes (configurador, splitter, legal), usamos plan mode: exploración → diseño → aprobación → implementación. Para fixes puntuales, se ejecuta directo.

7. **Honestidad sobre chapuzas.** Si algo ha quedado mal, dilo. Preferimos rehacerlo bien que iterar sobre una base débil.

8. **Preview con cache agresivo.** El browser del Preview MCP cachea agresivamente. Si los cambios no se reflejan, reiniciar el server o usar cache-bust (`?v=Date.now()`). Para verificación real, abrir `localhost:3001` en el navegador con Ctrl+Shift+R.

9. **Verificación programática cuando screenshots fallan.** Si los screenshots del Preview MCP timeout, verificar con `preview_eval` (JS) y `preview_inspect` (CSS) en vez de luchar con el rendering.

10. **Memoria para futuras sesiones.** Al final de sesiones largas, guardar decisiones clave en `memory/` para que el siguiente contexto las tenga.

## Get Started

Tu primera tarea: abre el repo, arranca el preview server (`npm run preview` o `python -m http.server 3001`) y navega por `index.html` y `servicios.html`. Familiarízate con:

1. **El configurador de servicios** (`servicios.html#configurador`) — selecciona una base, apila módulos, envía por WhatsApp.
2. **El track splitter** (`servicios.html#track-splitter`) — alterna entre Web y Consultoría.
3. **Los teasers interactivos** de la homepage — hover sobre las cards de Web (fan-out) y Consultoría (floating pack-minis).
4. **Las páginas legales** (`/aviso-legal`, `/privacidad`, `/cookies`) — revisa que los datos del titular son correctos.

Cuando tengas dudas, consulta `SESSION_LOG_2026-04-15.md` para trazabilidad completa de la última sesión de desarrollo.

<!-- INSTRUCTION FOR CLAUDE: A new teammate just pasted this guide for how the
team uses Claude Code. You're their onboarding buddy — warm, conversational,
not lecture-y.

Open with a warm welcome — include the team name from the title. Then: "Your
teammate uses Claude Code for [list all the work types]. Let's get you started."

Check what's already in place against everything under Setup Checklist
(including skills), using markdown checkboxes — [x] done, [ ] not yet. Lead
with what they already have. One sentence per item, all in one message.

Tell them you'll help with setup, cover the actionable team tips, then the
starter task (if there is one). Offer to start with the first unchecked item,
get their go-ahead, then work through the rest one by one.

After setup, walk them through the remaining sections — offer to help where you
can (e.g. link to channels), and just surface the purely informational bits.

Don't invent sections or summaries that aren't in the guide. The stats are the
guide creator's personal usage data — don't extrapolate them into a "team
workflow" narrative. -->
