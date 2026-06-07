import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react({ babel: { plugins: mode === 'development' ? [
    function __dualiteSourceLoc({ types: t }: any) {
      return { visitor: { JSXOpeningElement(path: any, state: any) {
        var fn = state.filename || '';
        if (!fn || fn.includes('node_modules')) return;
        var name = path.node.name;
        var reactSpecials = ['Fragment', 'StrictMode', 'Suspense', 'Profiler'];
        var isReactSpecial = (name.type === 'JSXIdentifier' && reactSpecials.indexOf(name.name) !== -1) ||
          (name.type === 'JSXMemberExpression' && name.object && name.object.name === 'React' && name.property && reactSpecials.indexOf(name.property.name) !== -1) ||
          (name.type === 'JSXMemberExpression' && name.property && (name.property.name === 'Provider' || name.property.name === 'Consumer'));
        if (isReactSpecial) return;
        var attrs = path.node.attributes;
        for (var i = 0; i < attrs.length; i++) {
          if (attrs[i].type === 'JSXAttribute' && attrs[i].name && attrs[i].name.name === 'data-ds') return;
        }
        var loc = path.node.loc;
        if (!loc) return;
        var wd = process.cwd() + '/';
        var rel = fn.startsWith(wd) ? fn.slice(wd.length) : fn;
        attrs.push(t.jsxAttribute(t.jsxIdentifier('data-ds'), t.stringLiteral(rel + ':' + loc.start.line + ':' + loc.start.column)));
      } } };
    }
  ] : [] } })],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
