/** Layout-free wrapper for the embeddable widget iframe.
 *  Strips all global UI (nav, footer, theme toggle) so the widget
 *  renders as a standalone badge. The root layout's <html>/<body>
 *  still apply but the widget's inline CSS overrides backgrounds. */
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
